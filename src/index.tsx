import {Hono} from 'hono'
import {cors} from 'hono/cors'
import {serveStatic} from 'hono/cloudflare-workers'

type Bindings = {
    DB: D1Database
    LARK_APP_ID: string
    LARK_APP_SECRET: string
    LARK_SPREADSHEET_TOKEN: string
    LARK_SHEET_ID: string
    LARK_SHEET_ID_MAPPING: string
}

const app = new Hono<{ Bindings: Bindings }>()

function ensureSafeNumber(value: any, defaultValue: number = 0): number {
    const num = Number(value)
    return (isNaN(num) || num === null || num === undefined) ? defaultValue : num
}

async function getLarkAccessToken(appId: string, appSecret: string): Promise<string> {
    const res = await fetch('https://open.larksuite.com/open-apis/auth/v3/app_access_token/internal', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({app_id: appId, app_secret: appSecret}),
    })
    if (!res.ok) throw new Error(`Lark auth error: ${res.status}`)
    const data: any = await res.json()
    if (data.code !== 0) throw new Error(`Lark auth failed: ${data.msg}`)
    return data.app_access_token
}

async function fetchSheetValues(token: string, spreadsheetToken: string, sheetId: string): Promise<any[][]> {
    const metaRes = await fetch(
        `https://open.larksuite.com/open-apis/sheets/v3/spreadsheets/${spreadsheetToken}/sheets/${sheetId}`,
        {headers: {'Authorization': `Bearer ${token}`}}
    )
    if (!metaRes.ok) throw new Error(`Lark sheet meta error: ${metaRes.status}`)
    const metaData: any = await metaRes.json()
    if (metaData.code !== 0) throw new Error(`Lark sheet meta failed: ${metaData.msg}`)
    const rowCount: number = metaData.data?.sheet?.grid_properties?.row_count ?? 2000

    const range = `${sheetId}!A1:AZ${rowCount}`
    const dataRes = await fetch(
        `https://open.larksuite.com/open-apis/sheets/v2/spreadsheets/${spreadsheetToken}/values/${range}`,
        {headers: {'Authorization': `Bearer ${token}`}}
    )
    if (!dataRes.ok) throw new Error(`Lark sheet read error: ${dataRes.status}`)
    const sheetData: any = await dataRes.json()
    if (sheetData.code !== 0) throw new Error(`Lark sheet read failed: ${sheetData.msg}`)
    return sheetData.data?.valueRange?.values ?? []
}

async function fetchLarkSheetRows(
    token: string,
    spreadsheetToken: string,
    sheetId: string
): Promise<Array<{ channel: string; video_create_time: string }>> {
    const values = await fetchSheetValues(token, spreadsheetToken, sheetId)
    if (values.length < 2) return []

    const headers: string[] = (values[0] ?? []).map((h: any) => String(h ?? '').trim())
    const channelIdx = headers.indexOf('channel')
    const dateIdx = headers.indexOf('video_create_time')

    if (channelIdx === -1 || dateIdx === -1) {
        throw new Error(`Không tìm thấy cột "channel" hoặc "video_create_time" trong sheet`)
    }

    const rows: Array<{ channel: string; video_create_time: string }> = []
    for (let i = 1; i < values.length; i++) {
        const row = values[i] ?? []
        const channel = String(row[channelIdx] ?? '').trim()
        const dateVal = String(row[dateIdx] ?? '').trim()
        if (channel && dateVal) rows.push({channel, video_create_time: dateVal})
    }
    return rows
}

async function fetchChannelEmailMapping(
    token: string,
    spreadsheetToken: string,
    mappingSheetId: string
): Promise<Map<string, string>> {
    const values = await fetchSheetValues(token, spreadsheetToken, mappingSheetId)
    const map = new Map<string, string>()
    if (values.length < 2) return map

    const headers: string[] = (values[0] ?? []).map((h: any) => String(h ?? '').trim())
    const channelIdx = headers.findIndex(h => h === 'Kênh tiktok')
    const emailIdx = headers.findIndex(h => h.toLowerCase() === 'email')

    if (channelIdx === -1 || emailIdx === -1) return map

    for (let i = 1; i < values.length; i++) {
        const row = values[i] ?? []
        const channel = String(row[channelIdx] ?? '').trim().toLowerCase()
        const email = String(row[emailIdx] ?? '').trim().toLowerCase()
        if (channel && email) map.set(channel, email)
    }
    return map
}

function calculateWorkingDaysBase(year: number, month: number): number {
    const daysInMonth = new Date(year, month, 0).getDate()
    let sundays = 0
    for (let d = 1; d <= daysInMonth; d++) {
        if (new Date(year, month - 1, d).getDay() === 0) sundays++
    }
    return daysInMonth - sundays - 1
}

async function calculateWorkingDays(db: D1Database, year: number, month: number): Promise<number> {
    const base = calculateWorkingDaysBase(year, month)
    const row = await db.prepare(
        'SELECT holiday_count FROM holiday_days WHERE year = ? AND month = ?'
    ).bind(year, month).first()
    const holidays = (row?.holiday_count as number) ?? 0
    return Math.max(base - holidays, 0)
}

const LARK_BATCH_SIZE = 500

async function* fetchLarkSheetBatches(
    token: string,
    spreadsheetToken: string,
    sheetId: string,
    channelEmailMap: Map<string, string>
): AsyncGenerator<Array<{ channel: string; email: string; video_create_time: string }>> {

    const headerRange = `${sheetId}!A1:AZ1`
    const headerRes = await fetch(
        `https://open.larksuite.com/open-apis/sheets/v2/spreadsheets/${spreadsheetToken}/values/${headerRange}`,
        {headers: {'Authorization': `Bearer ${token}`}}
    )
    if (!headerRes.ok) throw new Error(`Lark header error: ${headerRes.status}`)
    const headerData: any = await headerRes.json()
    if (headerData.code !== 0) throw new Error(`Lark header failed: ${headerData.msg}`)

    const headers: string[] = (headerData.data?.valueRange?.values?.[0] ?? [])
        .map((h: any) => String(h ?? '').trim())
    const channelIdx = headers.indexOf('channel')
    const dateIdx = headers.indexOf('video_create_time')
    if (channelIdx === -1 || dateIdx === -1) {
        throw new Error('Không tìm thấy cột "channel" hoặc "video_create_time"')
    }

    const metaRes = await fetch(
        `https://open.larksuite.com/open-apis/sheets/v3/spreadsheets/${spreadsheetToken}/sheets/${sheetId}`,
        {headers: {'Authorization': `Bearer ${token}`}}
    )
    if (!metaRes.ok) throw new Error(`Lark sheet meta error: ${metaRes.status}`)
    const metaData: any = await metaRes.json()
    const totalRows: number = metaData.data?.sheet?.grid_properties?.row_count ?? 5000

    let startRow = 2
    while (startRow <= totalRows) {
        const endRow = Math.min(startRow + LARK_BATCH_SIZE - 1, totalRows)
        const range = `${sheetId}!A${startRow}:AZ${endRow}`

        const batchRes = await fetch(
            `https://open.larksuite.com/open-apis/sheets/v2/spreadsheets/${spreadsheetToken}/values/${range}`,
            {headers: {'Authorization': `Bearer ${token}`}}
        )
        if (!batchRes.ok) throw new Error(`Lark batch error at row ${startRow}: ${batchRes.status}`)
        const batchData: any = await batchRes.json()
        if (batchData.code !== 0) throw new Error(`Lark batch failed: ${batchData.msg}`)

        const batchRows: any[][] = batchData.data?.valueRange?.values ?? []
        if (batchRows.length === 0) break

        const parsed: Array<{ channel: string; email: string; video_create_time: string }> = []
        for (const row of batchRows) {
            const channel = String(row[channelIdx] ?? '').trim()
            const dateVal = String(row[dateIdx] ?? '').trim()
            if (!channel || !dateVal) continue

            const email = channelEmailMap.get(channel.toLowerCase())
            if (!email) continue

            parsed.push({channel, email, video_create_time: dateVal})
        }

        if (parsed.length > 0) yield parsed

        startRow += LARK_BATCH_SIZE
    }
}

async function runLarkFullSync(env: any): Promise<{
    newRows: number
    skippedRows: number
    totalProcessed: number
    error?: string
}> {
    await env.DB.prepare(
        `UPDATE lark_sync_meta SET status = 'running', last_synced_at = CURRENT_TIMESTAMP WHERE id = 1`
    ).run()

    let newRows = 0
    let skippedRows = 0
    let totalProcessed = 0

    try {
        const larkToken = await getLarkAccessToken(env.LARK_APP_ID, env.LARK_APP_SECRET)

        const channelEmailMap = await fetchChannelEmailMapping(
            larkToken, env.LARK_SPREADSHEET_TOKEN, env.LARK_SHEET_ID_MAPPING
        )

        for await (const batch of fetchLarkSheetBatches(
            larkToken, env.LARK_SPREADSHEET_TOKEN, env.LARK_SHEET_ID, channelEmailMap
        )) {
            const D1_CHUNK = 100
            for (let i = 0; i < batch.length; i += D1_CHUNK) {
                const chunk = batch.slice(i, i + D1_CHUNK)
                const stmts = chunk.map(r =>
                    env.DB.prepare(
                        `INSERT OR IGNORE INTO lark_video_cache (channel, email, video_create_time)
                         VALUES (?, ?, ?)`
                    ).bind(r.channel, r.email, r.video_create_time)
                )
                const results = await env.DB.batch(stmts)
                for (const res of results) {
                    if ((res.meta?.changes ?? 0) > 0) newRows++
                    else skippedRows++
                }
            }
            totalProcessed += batch.length
        }

        await env.DB.prepare(
            `UPDATE lark_sync_meta
             SET status = 'done', last_row_count = ?, new_rows_added = ?, last_synced_at = CURRENT_TIMESTAMP
             WHERE id = 1`
        ).bind(totalProcessed, newRows).run()

        return {newRows, skippedRows, totalProcessed}

    } catch (err: any) {
        await env.DB.prepare(
            `UPDATE lark_sync_meta SET status = 'error' WHERE id = 1`
        ).run()
        return {newRows, skippedRows, totalProcessed, error: err.message}
    }
}

async function countVideosFromCache(
    db: D1Database,
    username: string,
    year: number,
    month: number
): Promise<number> {
    const prefix = `${year}/${String(month).padStart(2, '0')}`
    const email = `${username.toLowerCase()}@`

    const row = await db.prepare(`
        SELECT COUNT(*) as cnt
        FROM lark_video_cache
        WHERE email LIKE ?
          AND video_create_time LIKE ?
    `).bind(`${email}%`, `${prefix}%`).first()

    return (row?.cnt as number) ?? 0
}

async function runLarkSyncForUser(
    env: any,
    userId: number,
    year: number,
    month: number
): Promise<{ success: boolean; videoCount?: number; workingDays?: number; error?: string; skipped?: boolean; cacheEmpty?: boolean }> {
    const user = await env.DB.prepare(
        'SELECT id, username, position_id FROM users WHERE id = ?'
    ).bind(userId).first()

    if (!user) return {success: false, error: 'Không tìm thấy user'}
    if ((user.position_id as number) !== 4) return {success: true, skipped: true}

    const cacheCheck = await env.DB.prepare(
        `SELECT COUNT(*) as cnt FROM lark_video_cache`
    ).first()
    if ((cacheCheck?.cnt as number) === 0) {
        return {success: false, cacheEmpty: true, error: 'Chưa có dữ liệu cache. Admin cần đồng bộ Lark trước.'}
    }

    const videoCount = await countVideosFromCache(env.DB, user.username as string, year, month)

    const template = await env.DB.prepare(`
        SELECT id, standard_value, weight
        FROM kpi_templates
        WHERE id = 34
          AND position_id = 4
          AND is_for_kpi = 1 LIMIT 1
    `).first()

    const tpl = template ?? await env.DB.prepare(`
        SELECT id, standard_value, weight
        FROM kpi_templates
        WHERE position_id = 4
          AND is_for_kpi = 1
          AND kpi_name LIKE '%video post%'
        ORDER BY display_order LIMIT 1
    `).first()

    if (!tpl) return {success: false, error: 'Không tìm thấy KPI template video trong DB'}

    const workingDays = await calculateWorkingDays(env.DB, year, month)
    const completionPercent = Math.min((videoCount / workingDays) * 100, 150)
    const weightedScore = (completionPercent / 100) * (tpl.weight as number)
    const safeCount = ensureSafeNumber(videoCount, 0)
    const safeComp = ensureSafeNumber(completionPercent, 0)
    const safeWt = ensureSafeNumber(weightedScore, 0)

    await env.DB.prepare(`
        INSERT INTO kpi_data (user_id, month, year, kpi_template_id, actual_value, completion_percent, weighted_score)
        VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(user_id, month, year, kpi_template_id)
        DO
        UPDATE SET
            actual_value = ?,
            completion_percent = ?,
            weighted_score = ?,
            updated_at = CURRENT_TIMESTAMP
    `).bind(userId, month, year, tpl.id, safeCount, safeComp, safeWt, safeCount, safeComp, safeWt).run()

    return {success: true, videoCount, workingDays}
}

async function calculateMonthlySummary(db: D1Database, userId: number, year: number, month: number) {
    const user = await db.prepare('SELECT position_id FROM users WHERE id = ?').bind(userId).first()
    const positionId = user?.position_id || 0

    const kpiScore = await db.prepare(`
        SELECT SUM(weighted_score) as total
        FROM kpi_data kd
                 JOIN kpi_templates kt ON kd.kpi_template_id = kt.id
        WHERE kd.user_id = ?
          AND kd.year = ?
          AND kd.month = ?
          AND kt.is_for_kpi = 1
    `).bind(userId, year, month).first()

    const totalKpiScore = kpiScore?.total || 0
    const kpiPercent = totalKpiScore * 100
    let kpiLevel = 'Cần Cải Thiện'
    if (kpiPercent >= 120) kpiLevel = 'Xuất sắc'
    else if (kpiPercent >= 90) kpiLevel = 'Giỏi'
    else if (kpiPercent >= 70) kpiLevel = 'Khá'
    else if (kpiPercent >= 50) kpiLevel = 'Trung Bình'

    const levelScore = await db.prepare(`
        SELECT SUM(weighted_score) as total
        FROM kpi_data kd
                 JOIN kpi_templates kt ON kd.kpi_template_id = kt.id
        WHERE kd.user_id = ?
          AND kd.year = ?
          AND kd.month = ?
          AND kt.is_for_kpi = 0
    `).bind(userId, year, month).first()

    const totalLevelScore = levelScore?.total || 0
    const levelPercent = totalLevelScore * 100
    let performanceLevel = 'Xem xét lại'

    if (positionId === 1 || positionId === 5) {
        if (levelPercent >= 155) performanceLevel = 'Level 4'
        else if (levelPercent >= 131) performanceLevel = 'Level 3'
        else if (levelPercent > 100) performanceLevel = 'Level 2'
        else if (levelPercent >= 50) performanceLevel = 'Level 1'
    } else if (positionId === 2 || positionId === 3) {
        if (levelPercent >= 140) performanceLevel = 'Level 5'
        else if (levelPercent >= 121) performanceLevel = 'Level 4'
        else if (levelPercent >= 101) performanceLevel = 'Level 3'
        else if (levelPercent >= 81) performanceLevel = 'Level 2'
        else if (levelPercent >= 50) performanceLevel = 'Level 1'
    } else if (positionId === 4) {
        if (levelPercent >= 150) performanceLevel = 'Level 5'
        else if (levelPercent >= 131) performanceLevel = 'Level 4'
        else if (levelPercent >= 101) performanceLevel = 'Level 3'
        else if (levelPercent >= 76) performanceLevel = 'Level 2'
        else if (levelPercent >= 50) performanceLevel = 'Level 1'
    } else {
        if (levelPercent >= 155) performanceLevel = 'Level 4'
        else if (levelPercent >= 131) performanceLevel = 'Level 3'
        else if (levelPercent > 100) performanceLevel = 'Level 2'
        else if (levelPercent >= 50) performanceLevel = 'Level 1'
    }

    await db.prepare(`
        INSERT INTO monthly_summary (user_id, month, year, total_kpi_score, kpi_level, total_level_score,
                                     performance_level)
        VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(user_id, month, year)
        DO
        UPDATE SET
            total_kpi_score = ?,
            kpi_level = ?,
            total_level_score = ?,
            performance_level = ?,
            updated_at = CURRENT_TIMESTAMP
    `).bind(
        userId, month, year, totalKpiScore, kpiLevel, totalLevelScore, performanceLevel,
        totalKpiScore, kpiLevel, totalLevelScore, performanceLevel
    ).run()
}

app.use('/api/*', cors())

app.post('/api/login', async (c) => {
    try {
        const {username, password} = await c.req.json()

        const result = await c.env.DB.prepare(`
            SELECT u.id,
                   u.username,
                   u.full_name,
                   u.region_id,
                   u.position_id,
                   u.start_date,
                   u.cover_image_url,
                   r.name         as region_name,
                   p.name         as position_name,
                   p.display_name as position_display
            FROM users u
                     JOIN regions r ON u.region_id = r.id
                     JOIN positions p ON u.position_id = p.id
            WHERE u.username = ?
              AND u.password = ?
        `).bind(username, password).first()

        if (!result) return c.json({error: 'Sai tên đăng nhập hoặc mật khẩu'}, 401)

        let adminRegions = []
        if (username.startsWith('admin')) {
            const regions = await c.env.DB.prepare(`
                SELECT r.id, r.name
                FROM admin_regions ar
                         JOIN regions r ON ar.region_id = r.id
                WHERE ar.user_id = ?
                ORDER BY r.id
            `).bind(result.id).all()
            adminRegions = regions.results
        }

        return c.json({success: true, user: result, adminRegions})
    } catch (error) {
        return c.json({error: 'Lỗi đăng nhập'}, 500)
    }
})

app.get('/api/kpi-templates/:positionId', async (c) => {
    try {
        const positionId = c.req.param('positionId')
        const isForKpi = c.req.query('type') === 'level' ? 0 : 1

        const results = await c.env.DB.prepare(`
            SELECT id,
                   position_id,
                   kpi_name as name,
                   weight,
                   standard_value,
                   description,
                   is_for_kpi,
                   display_order,
                   created_at
            FROM kpi_templates
            WHERE position_id = ?
              AND is_for_kpi = ?
            ORDER BY display_order
        `).bind(positionId, isForKpi).all()

        return c.json({templates: results.results})
    } catch (error) {
        return c.json({error: 'Lỗi lấy danh sách KPI'}, 500)
    }
})

app.get('/api/kpi-data/:userId/:year/:month', async (c) => {
    try {
        const results = await c.env.DB.prepare(`
            SELECT kd.*, kt.kpi_name, kt.weight, kt.standard_value, kt.is_for_kpi
            FROM kpi_data kd
                     JOIN kpi_templates kt ON kd.kpi_template_id = kt.id
            WHERE kd.user_id = ?
              AND kd.year = ?
              AND kd.month = ?
            ORDER BY kt.is_for_kpi DESC, kt.display_order
        `).bind(c.req.param('userId'), c.req.param('year'), c.req.param('month')).all()

        return c.json({data: results.results})
    } catch (error) {
        return c.json({error: 'Lỗi lấy dữ liệu KPI'}, 500)
    }
})

app.get('/api/kpi-form-data/:userId/:positionId/:year/:month', async (c) => {
    try {
        const userId = c.req.param('userId')
        const positionId = c.req.param('positionId')
        const year = c.req.param('year')
        const month = c.req.param('month')
        const isForKpi = c.req.query('type') === 'level' ? 0 : 1

        const templates = await c.env.DB.prepare(`
            SELECT id,
                   position_id,
                   kpi_name,
                   weight,
                   standard_value,
                   description,
                   is_for_kpi,
                   display_order,
                   created_at
            FROM kpi_templates
            WHERE position_id = ?
              AND is_for_kpi = ?
            ORDER BY display_order
        `).bind(positionId, isForKpi).all()

        const revenuePlanRows = await c.env.DB.prepare(`
            SELECT month, planned_revenue
            FROM revenue_plan
            WHERE user_id = ? AND year = ?
        `).bind(userId, year).all()

        const revenuePlanMap: any = {}
        revenuePlanRows.results.forEach((p: any) => {
            revenuePlanMap[p.month] = p.planned_revenue
        })

        const existingData = await c.env.DB.prepare(`
            SELECT kd.*, kt.kpi_name
            FROM kpi_data kd
                     JOIN kpi_templates kt ON kd.kpi_template_id = kt.id
            WHERE kd.user_id = ?
              AND kd.year = ?
              AND kd.month = ?
        `).bind(userId, year, month).all()

        return c.json({
            templates: templates.results,
            revenuePlan: revenuePlanMap[parseInt(month)] || null,
            existingData: existingData.results
        })
    } catch (error) {
        return c.json({error: 'Lỗi lấy dữ liệu form KPI'}, 500)
    }
})

app.get('/api/tracking/:userId/:year', async (c) => {
    try {
        const userId = c.req.param('userId')
        const year = c.req.param('year')

        const user = await c.env.DB.prepare('SELECT position_id FROM users WHERE id = ?').bind(userId).first()
        if (!user) return c.json({error: 'Người dùng không tồn tại'}, 404)

        const kpiTemplates = await c.env.DB.prepare(`
            SELECT id, kpi_name, weight, standard_value, display_order
            FROM kpi_templates
            WHERE position_id = ?
              AND is_for_kpi = 1
            ORDER BY display_order
        `).bind(user.position_id).all()

        const levelTemplates = await c.env.DB.prepare(`
            SELECT id, kpi_name as name, weight, standard_value, display_order
            FROM kpi_templates
            WHERE position_id = ?
              AND is_for_kpi = 0
            ORDER BY display_order
        `).bind(user.position_id).all()

        const kpiData = await c.env.DB.prepare(`
            SELECT kd.*, kt.is_for_kpi
            FROM kpi_data kd
                     JOIN kpi_templates kt ON kd.kpi_template_id = kt.id
            WHERE kd.user_id = ?
              AND kd.year = ?
              AND kt.is_for_kpi = 1
            ORDER BY kd.month, kt.display_order
        `).bind(userId, year).all()

        const levelData = await c.env.DB.prepare(`
            SELECT kd.*, kt.is_for_kpi
            FROM kpi_data kd
                     JOIN kpi_templates kt ON kd.kpi_template_id = kt.id
            WHERE kd.user_id = ?
              AND kd.year = ?
              AND kt.is_for_kpi = 0
            ORDER BY kd.month, kt.display_order
        `).bind(userId, year).all()

        return c.json({
            kpiData: kpiData.results,
            levelData: levelData.results,
            templates: {kpi: kpiTemplates.results, level: levelTemplates.results}
        })
    } catch (error) {
        return c.json({error: 'Lỗi lấy dữ liệu tracking'}, 500)
    }
})

app.post('/api/kpi-data', async (c) => {
    try {
        const {userId, year, month, kpiData} = await c.req.json()

        const user = await c.env.DB.prepare('SELECT position_id, start_date FROM users WHERE id = ?').bind(userId).first()
        if (!user) return c.json({error: 'Không tìm thấy user'}, 404)

        const lockCheck = await c.env.DB.prepare(
            'SELECT id FROM lock_months WHERE year = ? AND month = ? AND position_id = ?'
        ).bind(year, month, user.position_id).first()
        if (lockCheck) return c.json({error: 'Tháng này đã được duyệt và khóa. Không thể chỉnh sửa!'}, 403)

        const isGiamSat = user.position_id === 4

        for (const item of kpiData) {
            const {templateId, actualValue} = item
            if (actualValue === undefined || actualValue === null || isNaN(actualValue)) continue

            const template = await c.env.DB.prepare('SELECT * FROM kpi_templates WHERE id = ?').bind(templateId).first()
            if (!template) continue

            let actualValueToUse = actualValue

            if (template.is_for_kpi === 0) {
                const kpiTemplate = await c.env.DB.prepare(
                    'SELECT id FROM kpi_templates WHERE kpi_name = ? AND is_for_kpi = 1'
                ).bind(template.kpi_name).first()

                if (kpiTemplate) {
                    const kpiDataRow = await c.env.DB.prepare(
                        'SELECT actual_value FROM kpi_data WHERE user_id = ? AND year = ? AND month = ? AND kpi_template_id = ?'
                    ).bind(userId, year, month, kpiTemplate.id).first()
                    if (kpiDataRow && kpiDataRow.actual_value !== null) actualValueToUse = kpiDataRow.actual_value
                }
            }

            const isRevenueGrowthKpi = template.kpi_name?.includes('doanh thu tăng trưởng')
            const isRevenueKpi = template.kpi_name?.includes('doanh thu') && !template.kpi_name?.includes('%')
            const isPercentageKpi = (template.kpi_name?.includes('Tỷ lệ') || template.kpi_name?.includes('tỷ lệ')) && !isRevenueGrowthKpi

            let adjustedValue = actualValueToUse
            if (isRevenueGrowthKpi || isRevenueKpi) adjustedValue = actualValueToUse * 1000000000
            else if (isPercentageKpi) adjustedValue = actualValueToUse / 100

            const maxPercent = template.is_for_kpi === 1 ? 150 : 160
            let completionPercent = (adjustedValue / template.standard_value) * 100
            completionPercent = Math.min(completionPercent, maxPercent)
            const weightedScore = (completionPercent / 100) * template.weight

            if (isNaN(completionPercent) || isNaN(weightedScore) || adjustedValue == null) continue

            const safeAdj = ensureSafeNumber(adjustedValue, 0)
            const safeComp = ensureSafeNumber(completionPercent, 0)
            const safeWt = ensureSafeNumber(weightedScore, 0)

            await c.env.DB.prepare(`
                INSERT INTO kpi_data (user_id, month, year, kpi_template_id, actual_value, completion_percent,
                                      weighted_score)
                VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(user_id, month, year, kpi_template_id)
                DO
                UPDATE SET actual_value = ?, completion_percent = ?, weighted_score = ?, updated_at = CURRENT_TIMESTAMP
            `).bind(userId, month, year, templateId, safeAdj, safeComp, safeWt, safeAdj, safeComp, safeWt).run()
        }

        const hasRevenue = [1, 2, 3, 5].includes(user.position_id)

        if (hasRevenue) {
            const revenuePlan = await c.env.DB.prepare(
                'SELECT planned_revenue FROM revenue_plan WHERE user_id = ? AND year = ? AND month = ?'
            ).bind(userId, year, month).first()

            const levelTemplates = await c.env.DB.prepare(`
                SELECT id, kpi_name, weight, standard_value
                FROM kpi_templates
                WHERE position_id = ?
                  AND is_for_kpi = 0
                ORDER BY display_order
            `).bind(user.position_id).all()

            if (levelTemplates.results.length >= 2 && revenuePlan) {
                const revenueKpiTemplate = await c.env.DB.prepare(`
                    SELECT id
                    FROM kpi_templates
                    WHERE position_id = ?
                      AND is_for_kpi = 1
                      AND (kpi_name LIKE '%Tổng doanh thu thực tế%' OR kpi_name LIKE '%doanh thu tăng trưởng%')
                `).bind(user.position_id).first()

                if (revenueKpiTemplate) {
                    const revenueKpiData = await c.env.DB.prepare(
                        'SELECT actual_value FROM kpi_data WHERE user_id = ? AND year = ? AND month = ? AND kpi_template_id = ?'
                    ).bind(userId, year, month, revenueKpiTemplate.id).first()

                    if (revenueKpiData?.actual_value) {
                        const actualRevenue = ensureSafeNumber(revenueKpiData.actual_value, 0)
                        const lt1 = levelTemplates.results[0]
                        const l1Comp = Math.min((actualRevenue / lt1.standard_value) * 100, 160)
                        const l1Score = (l1Comp / 100) * lt1.weight

                        await c.env.DB.prepare(`
                            INSERT INTO kpi_data (user_id, month, year, kpi_template_id, actual_value,
                                                  completion_percent, weighted_score)
                            VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(user_id, month, year, kpi_template_id)
                            DO
                            UPDATE SET actual_value = ?, completion_percent = ?, weighted_score = ?, updated_at = CURRENT_TIMESTAMP
                        `).bind(userId, month, year, lt1.id,
                            ensureSafeNumber(actualRevenue), ensureSafeNumber(l1Comp), ensureSafeNumber(l1Score),
                            ensureSafeNumber(actualRevenue), ensureSafeNumber(l1Comp), ensureSafeNumber(l1Score)
                        ).run()

                        const lt2 = levelTemplates.results[1]
                        const growthPercent = (actualRevenue / (revenuePlan.planned_revenue * 1000000000)) - 1
                        const growthVal = Math.min(growthPercent * 100, 160)
                        const l2Comp = Math.min((growthPercent / lt2.standard_value) * 100, 160)
                        const l2Score = (l2Comp / 100) * lt2.weight

                        await c.env.DB.prepare(`
                            INSERT INTO kpi_data (user_id, month, year, kpi_template_id, actual_value,
                                                  completion_percent, weighted_score)
                            VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(user_id, month, year, kpi_template_id)
                            DO
                            UPDATE SET actual_value = ?, completion_percent = ?, weighted_score = ?, updated_at = CURRENT_TIMESTAMP
                        `).bind(userId, month, year, lt2.id,
                            ensureSafeNumber(growthVal), ensureSafeNumber(l2Comp), ensureSafeNumber(l2Score),
                            ensureSafeNumber(growthVal), ensureSafeNumber(l2Comp), ensureSafeNumber(l2Score)
                        ).run()
                    }
                }

                if (levelTemplates.results.length >= 3) {
                    const personnelKpiTpl = await c.env.DB.prepare(`
                        SELECT id
                        FROM kpi_templates
                        WHERE position_id = ?
                          AND is_for_kpi = 1
                          AND kpi_name LIKE '%nhân sự%'
                          AND kpi_name LIKE '%đạt chuẩn%'
                    `).bind(user.position_id).first()

                    if (personnelKpiTpl) {
                        const personnelKpiData = await c.env.DB.prepare(
                            'SELECT actual_value FROM kpi_data WHERE user_id = ? AND year = ? AND month = ? AND kpi_template_id = ?'
                        ).bind(userId, year, month, personnelKpiTpl.id).first()

                        if (personnelKpiData?.actual_value !== null) {
                            const lt3 = levelTemplates.results[2]
                            const l3Comp = Math.min((personnelKpiData.actual_value / lt3.standard_value) * 100, 160)
                            const l3Score = (l3Comp / 100) * lt3.weight

                            await c.env.DB.prepare(`
                                INSERT INTO kpi_data (user_id, month, year, kpi_template_id, actual_value,
                                                      completion_percent, weighted_score)
                                VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(user_id, month, year, kpi_template_id)
                                DO
                                UPDATE SET actual_value = ?, completion_percent = ?, weighted_score = ?, updated_at = CURRENT_TIMESTAMP
                            `).bind(userId, month, year, lt3.id,
                                ensureSafeNumber(personnelKpiData.actual_value), ensureSafeNumber(l3Comp), ensureSafeNumber(l3Score),
                                ensureSafeNumber(personnelKpiData.actual_value), ensureSafeNumber(l3Comp), ensureSafeNumber(l3Score)
                            ).run()
                        }
                    }
                }
            }

            if (user.start_date && levelTemplates.results.length >= 4) {
                const yearsExp = (Date.now() - new Date(user.start_date).getTime()) / (1000 * 60 * 60 * 24 * 365.25)
                const expTpl = levelTemplates.results[3]
                const expComp = ensureSafeNumber(Math.min((yearsExp / expTpl.standard_value) * 100, 160), 0)
                const expScore = ensureSafeNumber((expComp / 100) * expTpl.weight, 0)

                await c.env.DB.prepare(`
                    INSERT INTO kpi_data (user_id, month, year, kpi_template_id, actual_value, completion_percent,
                                          weighted_score)
                    VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(user_id, month, year, kpi_template_id)
                    DO
                    UPDATE SET actual_value = ?, completion_percent = ?, weighted_score = ?, updated_at = CURRENT_TIMESTAMP
                `).bind(userId, month, year, expTpl.id,
                    ensureSafeNumber(yearsExp), expComp, expScore,
                    ensureSafeNumber(yearsExp), expComp, expScore
                ).run()
            }
        }

        if (isGiamSat) {
            const levelTemplates = await c.env.DB.prepare(`
                SELECT id, kpi_name
                FROM kpi_templates
                WHERE position_id = 4
                  AND is_for_kpi = 0
                ORDER BY display_order
            `).all()

            for (let i = 0; i < 3 && i < levelTemplates.results.length; i++) {
                const levelTpl = levelTemplates.results[i]

                const kpiTpl = await c.env.DB.prepare(`
                    SELECT id
                    FROM kpi_templates
                    WHERE position_id = ?
                      AND is_for_kpi = 1
                      AND kpi_name = ?
                `).bind(user.position_id, levelTpl.kpi_name).first()

                if (!kpiTpl) continue

                const kpiRow = await c.env.DB.prepare(
                    'SELECT actual_value, completion_percent, weighted_score FROM kpi_data WHERE user_id = ? AND year = ? AND month = ? AND kpi_template_id = ?'
                ).bind(userId, year, month, kpiTpl.id).first()

                if (!kpiRow?.actual_value || !kpiRow?.completion_percent) continue

                const levelTplInfo = await c.env.DB.prepare(
                    'SELECT weight, standard_value FROM kpi_templates WHERE id = ?'
                ).bind(levelTpl.id).first()

                let levelComp = (kpiRow.actual_value / levelTplInfo.standard_value) * 100
                levelComp = Math.min(levelComp, 160)
                const levelScore = (levelComp / 100) * levelTplInfo.weight

                if (isNaN(levelComp) || isNaN(levelScore)) continue

                await c.env.DB.prepare(`
                    INSERT INTO kpi_data (user_id, month, year, kpi_template_id, actual_value, completion_percent,
                                          weighted_score)
                    VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(user_id, month, year, kpi_template_id)
                    DO
                    UPDATE SET actual_value = ?, completion_percent = ?, weighted_score = ?, updated_at = CURRENT_TIMESTAMP
                `).bind(userId, month, year, levelTpl.id,
                    ensureSafeNumber(kpiRow.actual_value), ensureSafeNumber(levelComp), ensureSafeNumber(levelScore),
                    ensureSafeNumber(kpiRow.actual_value), ensureSafeNumber(levelComp), ensureSafeNumber(levelScore)
                ).run()
            }

            if (user.start_date && levelTemplates.results.length >= 4) {
                const yearsExp = (Date.now() - new Date(user.start_date).getTime()) / (1000 * 60 * 60 * 24 * 365.25)
                const expTpl = levelTemplates.results[3]
                const expTplInfo = await c.env.DB.prepare(
                    'SELECT weight, standard_value FROM kpi_templates WHERE id = ?'
                ).bind(expTpl.id).first()

                if (expTplInfo?.weight && expTplInfo?.standard_value) {
                    const expComp = ensureSafeNumber(Math.min((yearsExp / expTplInfo.standard_value) * 100, 160), 0)
                    const expScore = ensureSafeNumber((expComp / 100) * expTplInfo.weight, 0)

                    await c.env.DB.prepare(`
                        INSERT INTO kpi_data (user_id, month, year, kpi_template_id, actual_value, completion_percent,
                                              weighted_score)
                        VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(user_id, month, year, kpi_template_id)
                        DO
                        UPDATE SET actual_value = ?, completion_percent = ?, weighted_score = ?, updated_at = CURRENT_TIMESTAMP
                    `).bind(userId, month, year, expTpl.id,
                        ensureSafeNumber(yearsExp), expComp, expScore,
                        ensureSafeNumber(yearsExp), expComp, expScore
                    ).run()
                }
            }
        }

        const allLevelTemplates = await c.env.DB.prepare(`
            SELECT id, kpi_name, weight, standard_value
            FROM kpi_templates
            WHERE position_id = ?
              AND is_for_kpi = 0
            ORDER BY display_order
        `).bind(user.position_id).all()

        for (let i = 0; i < 3 && i < allLevelTemplates.results.length; i++) {
            const lt = allLevelTemplates.results[i]

            const matchKpi = await c.env.DB.prepare(
                'SELECT id FROM kpi_templates WHERE position_id = ? AND is_for_kpi = 1 AND kpi_name = ?'
            ).bind(user.position_id, lt.kpi_name).first()

            if (!matchKpi) continue

            const kpiRow = await c.env.DB.prepare(
                'SELECT actual_value FROM kpi_data WHERE user_id = ? AND year = ? AND month = ? AND kpi_template_id = ?'
            ).bind(userId, year, month, matchKpi.id).first()

            if (!kpiRow?.actual_value) continue

            const ltComp = Math.min((kpiRow.actual_value / lt.standard_value) * 100, 160)
            const ltScore = (ltComp / 100) * lt.weight

            await c.env.DB.prepare(`
                INSERT INTO kpi_data (user_id, month, year, kpi_template_id, actual_value, completion_percent,
                                      weighted_score)
                VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(user_id, month, year, kpi_template_id)
                DO
                UPDATE SET actual_value = ?, completion_percent = ?, weighted_score = ?, updated_at = CURRENT_TIMESTAMP
            `).bind(userId, month, year, lt.id,
                kpiRow.actual_value, ltComp, ltScore,
                kpiRow.actual_value, ltComp, ltScore
            ).run()
        }

        await calculateMonthlySummary(c.env.DB, userId, year, month)
        return c.json({success: true, message: 'Lưu dữ liệu thành công'})
    } catch (error) {
        console.error('Error saving KPI:', error)
        return c.json({error: 'Lỗi lưu dữ liệu KPI'}, 500)
    }
})

app.post('/api/level-data', async (c) => {
    try {
        const {userId, year, month, levelData} = await c.req.json()

        const user = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first()
        if (!user) return c.json({error: 'User not found'}, 404)

        const lockCheck = await c.env.DB.prepare(
            'SELECT id FROM lock_months WHERE year = ? AND month = ? AND position_id = ?'
        ).bind(year, month, user.position_id).first()
        if (lockCheck) return c.json({error: 'Tháng này đã được duyệt và khóa. Không thể chỉnh sửa!'}, 403)

        for (const item of levelData) {
            const {templateId, actualValue} = item

            const template = await c.env.DB.prepare('SELECT * FROM kpi_templates WHERE id = ?').bind(templateId).first()
            if (!template) continue

            let actualValueToUse = actualValue

            const kpiTemplate = await c.env.DB.prepare(
                'SELECT id FROM kpi_templates WHERE kpi_name = ? AND is_for_kpi = 1'
            ).bind(template.kpi_name).first()

            if (kpiTemplate) {
                const kpiRow = await c.env.DB.prepare(
                    'SELECT actual_value FROM kpi_data WHERE user_id = ? AND year = ? AND month = ? AND kpi_template_id = ?'
                ).bind(userId, year, month, kpiTemplate.id).first()
                if (kpiRow?.actual_value !== null) actualValueToUse = kpiRow.actual_value
            }

            const isRevenueGrowthLevel = template.kpi_name?.includes('doanh thu tăng trưởng')
            let adjustedValue = actualValueToUse

            if (isRevenueGrowthLevel || (template.kpi_name?.includes('doanh thu') && !template.kpi_name?.includes('%'))) {
                adjustedValue = actualValueToUse * 1000000000
            } else if ((template.kpi_name?.includes('Tỷ lệ %') || template.kpi_name?.includes('tỷ lệ %')) && !isRevenueGrowthLevel) {
                adjustedValue = actualValueToUse / 100
            }

            const completionPercent = ensureSafeNumber(Math.min((adjustedValue / template.standard_value) * 100, 160), 0)
            const weightedScore = ensureSafeNumber((completionPercent / 100) * template.weight, 0)

            await c.env.DB.prepare(`
                INSERT INTO kpi_data (user_id, month, year, kpi_template_id, actual_value, completion_percent,
                                      weighted_score)
                VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(user_id, month, year, kpi_template_id)
                DO
                UPDATE SET actual_value = ?, completion_percent = ?, weighted_score = ?, updated_at = CURRENT_TIMESTAMP
            `).bind(userId, month, year, templateId,
                ensureSafeNumber(adjustedValue), ensureSafeNumber(completionPercent), ensureSafeNumber(weightedScore),
                ensureSafeNumber(adjustedValue), ensureSafeNumber(completionPercent), ensureSafeNumber(weightedScore)
            ).run()
        }

        await calculateMonthlySummary(c.env.DB, userId, year, month)
        return c.json({success: true, message: 'Lưu dữ liệu thành công'})
    } catch (error) {
        console.error('Error saving Level:', error)
        return c.json({error: 'Lỗi lưu dữ liệu Level'}, 500)
    }
})

app.get('/api/summary/:userId/:year/:month', async (c) => {
    try {
        const summary = await c.env.DB.prepare(
            'SELECT * FROM monthly_summary WHERE user_id = ? AND year = ? AND month = ?'
        ).bind(c.req.param('userId'), c.req.param('year'), c.req.param('month')).first()
        return c.json({summary})
    } catch (error) {
        return c.json({error: 'Lỗi lấy tổng hợp'}, 500)
    }
})

app.get('/api/monthly-summary/:userId/:year', async (c) => {
    try {
        const summaries = await c.env.DB.prepare(
            'SELECT * FROM monthly_summary WHERE user_id = ? AND year = ? ORDER BY month ASC'
        ).bind(c.req.param('userId'), c.req.param('year')).all()
        return c.json({summaries: summaries.results})
    } catch (error) {
        return c.json({error: 'Lỗi lấy lịch sử tháng'}, 500)
    }
})

app.get('/api/dashboard/:userId/:year/:month', async (c) => {
    try {
        const userId = c.req.param('userId')
        const year = c.req.param('year')
        const month = c.req.param('month')

        const currentUser = await c.env.DB.prepare(
            'SELECT id, username, position_id, region_id FROM users WHERE id = ?'
        ).bind(userId).first()
        if (!currentUser) return c.json({error: 'User not found'}, 404)

        const baseSelect = `
            SELECT u.id,
                   u.full_name,
                   u.username,
                   u.position_id,
                   u.region_id,
                   r.name         as region_name,
                   p.display_name as position_name,
                   ms.total_kpi_score,
                   ms.kpi_level,
                   ms.total_level_score,
                   ms.performance_level,
                   rp.planned_revenue
            FROM users u
                     JOIN regions r ON u.region_id = r.id
                     JOIN positions p ON u.position_id = p.id
                     LEFT JOIN monthly_summary ms ON u.id = ms.user_id AND ms.year = ? AND ms.month = ?
                     LEFT JOIN revenue_plan rp ON u.id = rp.user_id AND rp.year = ? AND rp.month = ?
        `
        const bindings = [year, month, year, month]

        let query = ''
        if (currentUser.username === 'admin') {
            query = baseSelect + `WHERE u.username NOT IN ('admin','admin1','admin2','admin3') ORDER BY r.id, p.id, ms.total_kpi_score DESC NULLS LAST`
        } else if (currentUser.position_id === 1 || currentUser.position_id === 5) {
            query = baseSelect + `WHERE u.position_id IN (1,2,3,4,5) AND u.username NOT IN ('admin','admin1','admin2','admin3') ORDER BY p.id, ms.total_kpi_score DESC NULLS LAST, r.id`
        } else if (currentUser.position_id === 2) {
            query = baseSelect + `WHERE u.position_id IN (2,3,4) ORDER BY p.id, ms.total_kpi_score DESC NULLS LAST, r.id`
        } else if (currentUser.position_id === 3) {
            query = baseSelect + `WHERE u.position_id IN (3,4) ORDER BY p.id, ms.total_kpi_score DESC NULLS LAST, r.id`
        } else if (currentUser.position_id === 4) {
            query = baseSelect + `WHERE u.position_id = 4 ORDER BY ms.total_kpi_score DESC NULLS LAST, r.id`
        }

        const results = await c.env.DB.prepare(query).bind(...bindings).all()
        return c.json({
            dashboard: results.results,
            isAdmin: currentUser.username === 'admin',
            positionId: currentUser.position_id
        })
    } catch (error) {
        console.error('Dashboard error:', error)
        return c.json({error: 'Lỗi lấy dashboard'}, 500)
    }
})

app.get('/api/admin/users', async (c) => {
    try {
        const userId = c.req.query('userId')
        const username = c.req.query('username')

        let regionFilter = ''
        if (username?.startsWith('admin') && userId) {
            const regions = await c.env.DB.prepare('SELECT region_id FROM admin_regions WHERE user_id = ?').bind(userId).all()
            const allowed = regions.results.map((r: any) => r.region_id)
            if (allowed.length > 0 && username !== 'admin') regionFilter = `AND u.region_id IN (${allowed.join(',')})`
        }

        const results = await c.env.DB.prepare(`
            SELECT u.id,
                   u.username,
                   u.full_name,
                   u.employee_id,
                   u.team,
                   u.start_date,
                   u.manager_id,
                   u.cover_image_url,
                   r.id              as region_id,
                   r.name            as region_name,
                   p.id              as position_id,
                   p.display_name    as position_name,
                   manager.full_name as manager_name,
                   manager.username  as manager_username
            FROM users u
                     JOIN regions r ON u.region_id = r.id
                     JOIN positions p ON u.position_id = p.id
                     LEFT JOIN users manager ON u.manager_id = manager.id
            WHERE u.username NOT LIKE 'admin%' ${regionFilter}
            ORDER BY r.id, p.id, u.full_name
        `).all()

        return c.json({users: results.results})
    } catch (error) {
        console.error('Error fetching users:', error)
        return c.json({error: 'Lỗi lấy danh sách người dùng'}, 500)
    }
})

app.get('/api/admin/metadata', async (c) => {
    try {
        const regions = await c.env.DB.prepare('SELECT id, name FROM regions ORDER BY id').all()
        const positions = await c.env.DB.prepare('SELECT id, name, display_name, level FROM positions ORDER BY id').all()
        return c.json({regions: regions.results, positions: positions.results})
    } catch (error) {
        return c.json({error: 'Lỗi lấy metadata'}, 500)
    }
})

app.get('/api/admin/statistics', async (c) => {
    try {
        const userId = c.req.query('userId')
        const username = c.req.query('username')

        let regionFilter = ''
        if (username?.startsWith('admin') && userId) {
            const regions = await c.env.DB.prepare('SELECT region_id FROM admin_regions WHERE user_id = ?').bind(userId).all()
            const allowed = regions.results.map((r: any) => r.region_id)
            if (allowed.length > 0 && username !== 'admin') regionFilter = `AND region_id IN (${allowed.join(',')})`
        }

        const positionCounts = await c.env.DB.prepare(`
            SELECT p.id, p.display_name, COUNT(u.id) as count
            FROM positions p
                LEFT JOIN users u
            ON p.id = u.position_id AND u.username NOT LIKE 'admin%' ${regionFilter}
            GROUP BY p.id, p.display_name
            ORDER BY p.id
        `).all()

        return c.json({positionCounts: positionCounts.results})
    } catch (error) {
        console.error('Error fetching statistics:', error)
        return c.json({error: 'Lỗi lấy thống kê'}, 500)
    }
})

app.get('/api/admin/kpi-templates', async (c) => {
    try {
        const templates = await c.env.DB.prepare(`
            SELECT kt.id,
                   kt.position_id,
                   p.display_name as position_name,
                   kt.kpi_name,
                   kt.weight,
                   kt.standard_value,
                   kt.description,
                   kt.is_for_kpi,
                   kt.display_order
            FROM kpi_templates kt
                     JOIN positions p ON kt.position_id = p.id
            ORDER BY kt.position_id, kt.is_for_kpi DESC, kt.display_order
        `).all()
        return c.json({templates: templates.results})
    } catch (error) {
        return c.json({error: 'Lỗi lấy KPI templates'}, 500)
    }
})

app.get('/api/admin/dashboard/:positionIds/:year', async (c) => {
    try {
        const positionIds = c.req.param('positionIds').split(',').map(id => parseInt(id))
        const year = c.req.param('year')
        const userId = c.req.query('userId')
        const username = c.req.query('username')

        let regionFilter = ''
        if (username?.startsWith('admin') && userId) {
            const regions = await c.env.DB.prepare('SELECT region_id FROM admin_regions WHERE user_id = ?').bind(userId).all()
            const allowed = regions.results.map((r: any) => r.region_id)
            if (allowed.length > 0 && username !== 'admin') regionFilter = `AND u.region_id IN (${allowed.join(',')})`
        }

        const users = await c.env.DB.prepare(`
            SELECT u.id, u.full_name, u.username, r.name as region_name
            FROM users u
                     JOIN regions r ON u.region_id = r.id
            WHERE u.position_id IN (${positionIds.join(',')}) ${regionFilter}
              AND u.username NOT LIKE 'admin%'
            ORDER BY r.id, u.full_name
        `).all()

        const templates = await c.env.DB.prepare(`
            SELECT id, kpi_name, weight, standard_value, is_for_kpi, display_order, position_id
            FROM kpi_templates
            WHERE position_id IN (${positionIds.join(',')})
            ORDER BY position_id, is_for_kpi DESC, display_order
        `).all()

        const monthlyData = await c.env.DB.prepare(`
            SELECT user_id, month, total_kpi_score, kpi_level, total_level_score, performance_level
            FROM monthly_summary
            WHERE year = ? AND user_id IN (${users.results.map((u: any) => u.id).join(',') || '0'})
        `).bind(year).all()

        return c.json({users: users.results, templates: templates.results, monthlyData: monthlyData.results})
    } catch (error) {
        return c.json({error: 'Lỗi lấy dữ liệu dashboard'}, 500)
    }
})

app.get('/api/admin/kpi-detail/:positionIds/:year/:kpiIds', async (c) => {
    try {
        const positionIds = c.req.param('positionIds').split(',').map(id => parseInt(id))
        const year = c.req.param('year')
        const kpiIds = c.req.param('kpiIds').split(',').map(id => parseInt(id))
        const userId = c.req.query('userId')
        const username = c.req.query('username')

        let regionFilter = ''
        if (username?.startsWith('admin') && userId) {
            const regions = await c.env.DB.prepare('SELECT region_id FROM admin_regions WHERE user_id = ?').bind(userId).all()
            const allowed = regions.results.map((r: any) => r.region_id)
            if (allowed.length > 0 && username !== 'admin') regionFilter = `AND u.region_id IN (${allowed.join(',')})`
        }

        const users = await c.env.DB.prepare(`
            SELECT u.id, u.full_name, u.username, r.name as region_name
            FROM users u
                     JOIN regions r ON u.region_id = r.id
            WHERE u.position_id IN (${positionIds.join(',')}) ${regionFilter}
              AND u.username NOT LIKE 'admin%'
            ORDER BY r.id, u.full_name
        `).all()

        const kpiTemplates = await c.env.DB.prepare(`
            SELECT id, kpi_name, weight, standard_value, is_for_kpi
            FROM kpi_templates
            WHERE id IN (${kpiIds.join(',')})
            ORDER BY display_order
        `).all()

        const kpiData = await c.env.DB.prepare(`
            SELECT user_id, kpi_template_id, month, actual_value
            FROM kpi_data
            WHERE year = ?
              AND user_id IN (${users.results.map((u: any) => u.id).join(',') || '0'})
              AND kpi_template_id IN (${kpiIds.join(',')})
            ORDER BY user_id, kpi_template_id, month
        `).bind(year).all()

        return c.json({users: users.results, kpiTemplates: kpiTemplates.results, kpiData: kpiData.results})
    } catch (error) {
        return c.json({error: 'Lỗi lấy dữ liệu KPI chi tiết'}, 500)
    }
})

app.get('/api/admin/revenue-plan/:year', async (c) => {
    try {
        const year = c.req.param('year')
        const userId = c.req.query('userId')
        const username = c.req.query('username')

        let regionFilter = ''
        if (username?.startsWith('admin') && userId) {
            const regions = await c.env.DB.prepare('SELECT region_id FROM admin_regions WHERE user_id = ?').bind(userId).all()
            const allowed = regions.results.map((r: any) => r.region_id)
            if (allowed.length > 0 && username !== 'admin') regionFilter = `AND u.region_id IN (${allowed.join(',')})`
        }

        const users = await c.env.DB.prepare(`
            SELECT u.id, u.full_name, u.username, r.name as region_name, p.display_name as position_name
            FROM users u
                     JOIN regions r ON u.region_id = r.id
                     JOIN positions p ON u.position_id = p.id
            WHERE u.position_id IN (1, 2, 3, 5) ${regionFilter} AND u.username NOT LIKE 'admin%'
            ORDER BY r.id, p.id, u.full_name
        `).all()

        const plans = await c.env.DB.prepare(`
            SELECT user_id, month, planned_revenue
            FROM revenue_plan
            WHERE year = ? AND user_id IN (${users.results.map((u: any) => u.id).join(',') || '0'})
        `).bind(year).all()

        return c.json({users: users.results, plans: plans.results})
    } catch (error) {
        return c.json({error: 'Lỗi lấy kế hoạch doanh thu'}, 500)
    }
})

app.post('/api/admin/revenue-plan', async (c) => {
    try {
        const {user_id, year, plans} = await c.req.json()

        if (!user_id) return c.json({error: 'Thiếu user_id'}, 400)
        if (!year) return c.json({error: 'Thiếu year'}, 400)
        if (!Array.isArray(plans) || plans.length === 0) return c.json({error: 'Dữ liệu plans không hợp lệ'}, 400)

        const user = await c.env.DB.prepare('SELECT id, full_name FROM users WHERE id = ?').bind(user_id).first()
        if (!user) return c.json({error: `Không tìm thấy người dùng với ID ${user_id}`}, 404)

        for (const plan of plans) {
            if (!plan.month || plan.month < 1 || plan.month > 12) return c.json({error: `Tháng không hợp lệ: ${plan.month}`}, 400)
            if (plan.planned_revenue < 0) return c.json({error: `Doanh thu tháng ${plan.month} không được âm`}, 400)
        }

        await c.env.DB.prepare('DELETE FROM revenue_plan WHERE user_id = ? AND year = ?').bind(user_id, year).run()

        for (const plan of plans) {
            if (plan.planned_revenue > 0) {
                await c.env.DB.prepare(
                    'INSERT INTO revenue_plan (user_id, year, month, planned_revenue) VALUES (?, ?, ?, ?)'
                ).bind(user_id, year, plan.month, plan.planned_revenue).run()
            }
        }

        return c.json({success: true, message: `Đã lưu kế hoạch năm ${year} cho ${user.full_name}`})
    } catch (error) {
        const msg = error instanceof Error ? error.message : String(error)
        return c.json({error: `Lỗi lưu kế hoạch: ${msg}`}, 500)
    }
})

app.post('/api/admin/import-actual-revenue', async (c) => {
    try {
        const {rows} = await c.req.json()
        if (!Array.isArray(rows) || rows.length === 0) return c.json({
            success: false,
            message: 'Invalid rows data'
        }, 400)

        const db = c.env.DB
        const KPI_TEMPLATE_ID = 1
        const results = {success: 0, updated: 0, inserted: 0, skipped: [] as any[]}

        for (const row of rows) {
            const {actual_value, email, month, year} = row
            if (!email || !month || !year || actual_value == null) continue

            const user = await db.prepare('SELECT id FROM users WHERE username = ?').bind(email).first()
            if (!user) {
                results.skipped.push({email, reason: 'USER_NOT_FOUND'});
                continue
            }

            const existing = await db.prepare(
                'SELECT id FROM kpi_data WHERE user_id = ? AND month = ? AND year = ? AND kpi_template_id = ?'
            ).bind(user.id, month, year, KPI_TEMPLATE_ID).first()

            if (existing) {
                await db.prepare(
                    'UPDATE kpi_data SET actual_value = ?, completion_percent = 0, weighted_score = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
                ).bind(actual_value, existing.id).run()
                results.updated++
            } else {
                await db.prepare(
                    'INSERT INTO kpi_data (user_id, month, year, kpi_template_id, actual_value, completion_percent, weighted_score) VALUES (?, ?, ?, ?, ?, 0, 0)'
                ).bind(user.id, month, year, KPI_TEMPLATE_ID, actual_value).run()
                results.inserted++
            }
            results.success++
        }

        return c.json({success: true, results})
    } catch (error) {
        return c.json({error: 'Lỗi lưu doanh thu'}, 500)
    }
})

app.get('/api/admin/potential-managers/:regionId/:positionId', async (c) => {
    try {
        const regionId = c.req.param('regionId')
        const positionId = parseInt(c.req.param('positionId'))

        const selectedPosition = await c.env.DB.prepare('SELECT level FROM positions WHERE id = ?').bind(positionId).first()
        if (!selectedPosition || selectedPosition.level <= 1) return c.json({managers: []})

        const results = await c.env.DB.prepare(`
            SELECT u.id, u.full_name, u.username, p.level, p.display_name as position_name
            FROM users u
                     JOIN positions p ON u.position_id = p.id
            WHERE u.region_id = ?
              AND p.level < ?
              AND u.position_id != ?
              AND u.username NOT IN ('admin','admin1','admin2','admin3')
            ORDER BY p.level DESC, u.full_name
        `).bind(regionId, selectedPosition.level, positionId).all()

        return c.json({managers: results.results})
    } catch (error) {
        return c.json({error: 'Lỗi lấy danh sách quản lý'}, 500)
    }
})

app.post('/api/admin/users', async (c) => {
    try {
        const body = await c.req.json()
        const {username, password} = body
        const full_name = body.fullName || body.full_name
        const region_id = body.regionId || body.region_id
        const position_id = body.positionId || body.position_id
        const start_date = body.startDate || body.start_date
        const team = body.team || null
        const manager = body.manager || null

        const existing = await c.env.DB.prepare('SELECT id FROM users WHERE username = ?').bind(username).first()
        if (existing) return c.json({error: 'Tên đăng nhập đã tồn tại'}, 400)

        const result = await c.env.DB.prepare(
            'INSERT INTO users (username, password, full_name, region_id, position_id, start_date, team, manager_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        ).bind(username, password, full_name, region_id, position_id, start_date, team, manager).run()

        return c.json({success: true, message: 'Tạo tài khoản thành công', userId: result.meta.last_row_id})
    } catch (error) {
        return c.json({error: 'Lỗi tạo tài khoản'}, 500)
    }
})

app.put('/api/admin/users/:userId', async (c) => {
    try {
        const userId = c.req.param('userId')
        const body = await c.req.json()
        const updates: string[] = []
        const bindings: any[] = []

        if (body.full_name || body.fullName) {
            updates.push('full_name = ?');
            bindings.push(body.full_name || body.fullName)
        }
        if (body.password?.trim()) {
            updates.push('password = ?');
            bindings.push(body.password)
        }
        if (body.region_id || body.regionId) {
            updates.push('region_id = ?');
            bindings.push(body.region_id || body.regionId)
        }
        if (body.position_id || body.positionId) {
            updates.push('position_id = ?');
            bindings.push(body.position_id || body.positionId)
        }
        if (body.manager_id || body.managerId) {
            updates.push('manager_id = ?');
            bindings.push(body.manager_id || body.managerId)
        }
        if (body.hasOwnProperty('team')) {
            updates.push('team = ?');
            bindings.push(body.team || null)
        }
        if (body.start_date || body.startDate) {
            updates.push('start_date = ?');
            bindings.push(body.start_date || body.startDate)
        }
        if (body.hasOwnProperty('cover_image_url')) {
            updates.push('cover_image_url = ?');
            bindings.push(body.cover_image_url || null)
        }

        if (updates.length === 0) return c.json({error: 'Không có thông tin để cập nhật'}, 400)

        bindings.push(userId)
        await c.env.DB.prepare(`UPDATE users
                                SET ${updates.join(', ')}
                                WHERE id = ?`).bind(...bindings).run()
        return c.json({success: true, message: 'Cập nhật thành công'})
    } catch (error) {
        return c.json({error: 'Lỗi cập nhật thông tin'}, 500)
    }
})

app.delete('/api/admin/users/:userId', async (c) => {
    try {
        const userId = c.req.param('userId')

        const subordinates = await c.env.DB.prepare('SELECT COUNT(*) as count FROM users WHERE manager_id = ?').bind(userId).first()
        if (subordinates && subordinates.count > 0) return c.json({error: 'Không thể xóa vì còn nhân viên cấp dưới'}, 400)

        await c.env.DB.prepare('DELETE FROM kpi_data WHERE user_id = ?').bind(userId).run()
        await c.env.DB.prepare('DELETE FROM monthly_summary WHERE user_id = ?').bind(userId).run()
        await c.env.DB.prepare('DELETE FROM users WHERE id = ?').bind(userId).run()

        return c.json({success: true, message: 'Xóa tài khoản thành công'})
    } catch (error) {
        return c.json({error: 'Lỗi xóa tài khoản'}, 500)
    }
})

app.get('/api/users/:userId', async (c) => {
    try {
        const result = await c.env.DB.prepare(`
            SELECT u.*, r.name as region_name, p.name as position_name, p.display_name as position_display
            FROM users u
                     LEFT JOIN regions r ON u.region_id = r.id
                     LEFT JOIN positions p ON u.position_id = p.id
            WHERE u.id = ?
        `).bind(c.req.param('userId')).first()

        if (!result) return c.json({error: 'Không tìm thấy người dùng'}, 404)
        const {password, ...safeUser} = result as any
        return c.json({user: safeUser})
    } catch (error) {
        return c.json({error: 'Lỗi lấy thông tin người dùng'}, 500)
    }
})

app.post('/api/users/upload-cover', async (c) => {
    try {
        const formData = await c.req.formData()
        const file = formData.get('file') as File
        const userId = formData.get('userId') as string

        if (!file) return c.json({error: 'Không có file được upload'}, 400)

        const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf']
        if (!validTypes.includes(file.type)) return c.json({error: 'Định dạng file không hợp lệ. Chỉ chấp nhận PNG, JPG hoặc PDF'}, 400)
        if (file.size > 2 * 1024 * 1024) return c.json({error: 'File quá lớn. Vui lòng chọn file nhỏ hơn 2MB'}, 400)

        const bytes = new Uint8Array(await file.arrayBuffer())
        let base64 = ''
        const chunkSize = 8192
        for (let i = 0; i < bytes.length; i += chunkSize) {
            base64 += String.fromCharCode.apply(null, Array.from(bytes.slice(i, i + chunkSize)))
        }
        base64 = btoa(base64)

        const dataUrl = `data:${file.type};base64,${base64}`
        await c.env.DB.prepare('UPDATE users SET cover_image_url = ? WHERE id = ?').bind(dataUrl, userId).run()
        return c.json({success: true, message: 'Upload thành công', coverUrl: dataUrl})
    } catch (error) {
        return c.json({error: `Lỗi upload file: ${error.message}`}, 500)
    }
})

app.put('/api/users/:userId/cover', async (c) => {
    try {
        const body = await c.req.json()
        if (!body.cover_image_url) return c.json({error: 'Thiếu URL ảnh cover'}, 400)
        await c.env.DB.prepare('UPDATE users SET cover_image_url = ? WHERE id = ?').bind(body.cover_image_url, c.req.param('userId')).run()
        return c.json({success: true, message: 'Cập nhật ảnh cover thành công'})
    } catch (error) {
        return c.json({error: 'Lỗi cập nhật ảnh cover'}, 500)
    }
})

app.get('/api/recruitment-chart/:year/:month', async (c) => {
    try {
        const results = await c.env.DB.prepare(`
            SELECT u.id,
                   u.full_name,
                   u.username,
                   r.name as region_name,
                   kd.actual_value,
                   kd.completion_percent,
                   kt.standard_value
            FROM users u
                     JOIN regions r ON u.region_id = r.id
                     LEFT JOIN kpi_data kd
                               ON u.id = kd.user_id AND kd.year = ? AND kd.month = ? AND kd.kpi_template_id = 32
                     LEFT JOIN kpi_templates kt ON kt.id = 32
            WHERE u.position_id = 4
            ORDER BY kd.actual_value DESC NULLS LAST, u.full_name
        `).bind(c.req.param('year'), c.req.param('month')).all()

        return c.json({
            data: results.results,
            standard: 40,
            year: parseInt(c.req.param('year')),
            month: parseInt(c.req.param('month'))
        })
    } catch (error) {
        return c.json({error: 'Lỗi lấy dữ liệu biểu đồ'}, 500)
    }
})

app.post('/api/admin/recalc-level/:userId', async (c) => {
    try {
        const userId = parseInt(c.req.param('userId'))

        const user = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first()
        if (!user) return c.json({error: 'User not found'}, 404)

        const months = await c.env.DB.prepare(`
            SELECT DISTINCT month, year
            FROM kpi_data
            WHERE user_id = ? AND kpi_template_id IN (SELECT id FROM kpi_templates WHERE is_for_kpi = 1)
            ORDER BY year, month
        `).bind(userId).all()

        let processed = 0

        for (const row of months.results) {
            const {month, year} = row

            await c.env.DB.prepare(`
                DELETE
                FROM kpi_data
                WHERE user_id = ? AND year = ? AND month = ?
                  AND kpi_template_id IN (SELECT id FROM kpi_templates WHERE is_for_kpi = 0)
            `).bind(userId, year, month).run()

            const levelTemplates = await c.env.DB.prepare(`
                SELECT id, kpi_name, weight, standard_value
                FROM kpi_templates
                WHERE position_id = ?
                  AND is_for_kpi = 0
                ORDER BY display_order
            `).bind(user.position_id).all()

            for (let i = 0; i < 3 && i < levelTemplates.results.length; i++) {
                const lt = levelTemplates.results[i]

                const kpiTpl = await c.env.DB.prepare(
                    'SELECT id FROM kpi_templates WHERE position_id = ? AND is_for_kpi = 1 AND kpi_name = ?'
                ).bind(user.position_id, lt.kpi_name).first()

                if (!kpiTpl) continue

                const kpiRow = await c.env.DB.prepare(
                    'SELECT actual_value FROM kpi_data WHERE user_id = ? AND year = ? AND month = ? AND kpi_template_id = ?'
                ).bind(userId, year, month, kpiTpl.id).first()

                if (kpiRow?.actual_value !== null) {
                    let comp = (kpiRow.actual_value / lt.standard_value) * 100
                    comp = Math.min(comp, 160)
                    const score = (comp / 100) * lt.weight

                    await c.env.DB.prepare(
                        'INSERT INTO kpi_data (user_id, month, year, kpi_template_id, actual_value, completion_percent, weighted_score) VALUES (?, ?, ?, ?, ?, ?, ?)'
                    ).bind(userId, month, year, lt.id, kpiRow.actual_value, comp, score).run()
                }
            }

            await calculateMonthlySummary(c.env.DB, userId, year, month)
            processed++
        }

        return c.json({
            success: true,
            message: `Recalculated Level for ${processed} months`,
            userId,
            username: user.username
        })
    } catch (error) {
        return c.json({error: 'Failed to recalculate Level'}, 500)
    }
})

app.post('/api/change-password', async (c) => {
    try {
        const {userId, oldPassword, newPassword} = await c.req.json()

        if (!userId || !oldPassword || !newPassword) return c.json({error: 'Thiếu thông tin'}, 400)
        if (newPassword.length < 6) return c.json({error: 'Mật khẩu mới phải có ít nhất 6 ký tự'}, 400)

        const user = await c.env.DB.prepare('SELECT id, password FROM users WHERE id = ?').bind(userId).first()
        if (!user) return c.json({error: 'Không tìm thấy user'}, 404)
        if (user.password && user.password !== oldPassword) return c.json({error: 'Mật khẩu cũ không đúng'}, 401)

        await c.env.DB.prepare('UPDATE users SET password = ? WHERE id = ?').bind(newPassword, userId).run()
        return c.json({success: true, message: 'Đổi mật khẩu thành công'})
    } catch (error) {
        return c.json({error: 'Lỗi đổi mật khẩu'}, 500)
    }
})

app.get('/api/admin/lock-status/:year/:month/:positionId', async (c) => {
    try {
        const lock = await c.env.DB.prepare(`
            SELECT lm.*, u.full_name as locked_by_name
            FROM lock_months lm
                     LEFT JOIN users u ON lm.locked_by = u.id
            WHERE lm.year = ?
              AND lm.month = ?
              AND lm.position_id = ?
        `).bind(
            parseInt(c.req.param('year')),
            parseInt(c.req.param('month')),
            parseInt(c.req.param('positionId'))
        ).first()
        return c.json({isLocked: !!lock, lock: lock || null})
    } catch (error) {
        return c.json({error: 'Lỗi lấy trạng thái khóa'}, 500)
    }
})

app.post('/api/admin/lock-month', async (c) => {
    try {
        const {year, month, positionId, userId, notes} = await c.req.json()
        if (!year || !month || !positionId || !userId) return c.json({error: 'Thiếu thông tin'}, 400)

        const existing = await c.env.DB.prepare(
            'SELECT id FROM lock_months WHERE year = ? AND month = ? AND position_id = ?'
        ).bind(year, month, positionId).first()
        if (existing) return c.json({error: 'Tháng này đã được duyệt'}, 400)

        await c.env.DB.prepare(
            'INSERT INTO lock_months (year, month, position_id, locked_by, notes) VALUES (?, ?, ?, ?, ?)'
        ).bind(year, month, positionId, userId, notes || '').run()

        return c.json({success: true, message: `Đã duyệt và khóa tháng ${month}/${year}`})
    } catch (error) {
        return c.json({error: 'Lỗi khóa tháng'}, 500)
    }
})

app.post('/api/admin/unlock-month', async (c) => {
    try {
        const {year, month, positionId} = await c.req.json()
        if (!year || !month || !positionId) return c.json({error: 'Thiếu thông tin'}, 400)

        await c.env.DB.prepare(
            'DELETE FROM lock_months WHERE year = ? AND month = ? AND position_id = ?'
        ).bind(year, month, positionId).run()

        return c.json({success: true, message: `Đã mở khóa tháng ${month}/${year}`})
    } catch (error) {
        return c.json({error: 'Lỗi mở khóa tháng'}, 500)
    }
})

app.get('/api/admin/locked-months/:year', async (c) => {
    try {
        const locks = await c.env.DB.prepare(`
            SELECT lm.*, p.display_name as position_name, u.full_name as locked_by_name
            FROM lock_months lm
                     LEFT JOIN positions p ON lm.position_id = p.id
                     LEFT JOIN users u ON lm.locked_by = u.id
            WHERE lm.year = ?
            ORDER BY lm.month DESC, lm.position_id
        `).bind(parseInt(c.req.param('year'))).all()
        return c.json({locks: locks.results})
    } catch (error) {
        return c.json({error: 'Lỗi lấy danh sách tháng đã khóa'}, 500)
    }
})

app.get('/api/admin/holiday-days/:year', async (c) => {
    try {
        const year = parseInt(c.req.param('year'))
        const rows = await c.env.DB.prepare(
            'SELECT month, holiday_count, note FROM holiday_days WHERE year = ? ORDER BY month'
        ).bind(year).all()
        return c.json({success: true, holidays: rows.results})
    } catch (error) {
        return c.json({error: 'Lỗi lấy dữ liệu ngày lễ'}, 500)
    }
})

app.post('/api/admin/holiday-days', async (c) => {
    try {
        const {year, month, holiday_count, note} = await c.req.json()
        if (!year || !month || holiday_count === undefined) {
            return c.json({error: 'Thiếu thông tin: year, month, holiday_count'}, 400)
        }
        if (holiday_count < 0 || holiday_count > 15) {
            return c.json({error: 'Số ngày lễ không hợp lệ (0–15)'}, 400)
        }
        await c.env.DB.prepare(`
            INSERT INTO holiday_days (year, month, holiday_count, note)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(year, month) DO UPDATE SET
                holiday_count = excluded.holiday_count,
                note = excluded.note,
                updated_at = CURRENT_TIMESTAMP
        `).bind(year, month, holiday_count, note || '').run()

        const workingDays = await calculateWorkingDays(c.env.DB, year, month)
        return c.json({
            success: true,
            message: `Đã cập nhật ngày lễ tháng ${month}/${year}`,
            workingDays
        })
    } catch (error) {
        return c.json({error: 'Lỗi lưu ngày lễ'}, 500)
    }
})

app.delete('/api/admin/holiday-days/:year/:month', async (c) => {
    try {
        const year = parseInt(c.req.param('year'))
        const month = parseInt(c.req.param('month'))
        await c.env.DB.prepare(
            'DELETE FROM holiday_days WHERE year = ? AND month = ?'
        ).bind(year, month).run()
        return c.json({success: true, message: `Đã xóa ngày lễ tháng ${month}/${year}`})
    } catch (error) {
        return c.json({error: 'Lỗi xóa ngày lễ'}, 500)
    }
})

app.get('/api/admin/lark/sync-status', async (c) => {
    try {
        const meta = await c.env.DB.prepare(
            `SELECT * FROM lark_sync_meta WHERE id = 1`
        ).first()

        const cacheStats = await c.env.DB.prepare(
            `SELECT COUNT(*) as total,
                    COUNT(DISTINCT email) as unique_emails,
                    MIN(video_create_time) as oldest,
                    MAX(video_create_time) as newest
             FROM lark_video_cache`
        ).first()

        return c.json({success: true, meta, cacheStats})
    } catch (error) {
        return c.json({error: 'Lỗi lấy trạng thái sync'}, 500)
    }
})

app.post('/api/admin/lark/full-sync', async (c) => {
    try {
        const meta = await c.env.DB.prepare(
            `SELECT status FROM lark_sync_meta WHERE id = 1`
        ).first()
        if (meta?.status === 'running') {
            return c.json({error: 'Đang sync, vui lòng đợi hoàn tất'}, 409)
        }

        const result = await runLarkFullSync(c.env)

        if (result.error) {
            return c.json({
                success: false,
                error: result.error,
                totalProcessed: result.totalProcessed,
                newRows: result.newRows
            }, 200)
        }

        return c.json({
            success: true,
            newRows: result.newRows,
            skippedRows: result.skippedRows,
            totalProcessed: result.totalProcessed,
            message: `Đồng bộ xong: ${result.newRows} dòng mới, ${result.skippedRows} dòng đã có`
        })
    } catch (error: any) {
        return c.json({error: error.message ?? 'Lỗi sync Lark'}, 500)
    }
})

app.post('/api/lark/sync-video-kpi', async (c) => {
    try {
        const {userId, year, month} = await c.req.json()
        if (!userId || !year || !month) return c.json({error: 'Thiếu thông tin: userId, year, month'}, 400)

        const result = await runLarkSyncForUser(c.env, userId, year, month)

        if (result.skipped) return c.json({success: true, skipped: true, reason: 'Chỉ áp dụng cho Giám sát'})
        if (result.cacheEmpty) return c.json({success: false, cacheEmpty: true, error: result.error}, 200)
        if (!result.success) return c.json({success: false, error: result.error}, 200)

        return c.json({
            success: true,
            videoCount: result.videoCount,
            workingDays: result.workingDays,
            message: `Đã tự động điền ${result.videoCount} video cho tháng ${month}/${year} (chuẩn: ${result.workingDays} ngày công)`
        })
    } catch (error: any) {
        console.error('Lark sync error:', error)
        return c.json({success: false, error: error.message ?? 'Lỗi sync Lark'}, 200)
    }
})

app.get('/', (c) => {
    c.header('Cache-Control', 'no-cache, no-store, must-revalidate')
    c.header('Pragma', 'no-cache')
    c.header('Expires', '0')

    return c.html(`<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Hệ thống KPI - Công ty Nhân Kiệt</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="icon" type="image/svg+xml" href="/favicon.svg">
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
    <script src="https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js"></script>
    <style>
      * { -webkit-tap-highlight-color: transparent; }
      body { overscroll-behavior-y: none; }
      ::-webkit-scrollbar { width: 0px; height: 0px; }
      html { scroll-behavior: smooth; }
      input, select, textarea, button { font-size: 16px !important; }
      @media (min-width: 768px) { input, select, textarea { font-size: 14px !important; } }
      @media (max-width: 767px) {
        .dashboard-grid { display: flex !important; flex-direction: column !important; gap: 1rem !important; }
        .dashboard-grid > div { width: 100% !important; }
      }
    </style>
</head>
<body class="bg-gray-50 select-none">
    <div id="app"></div>
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script src="/app.js?v=${Date.now()}"></script>
</body>
</html>`)
})

app.use('/*', async (c, next) => {
    try {
        return await serveStatic({root: './'})(c, next)
    } catch (e) {
        return c.notFound()
    }
})

export default app
