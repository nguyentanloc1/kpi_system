import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'

type Bindings = {
  DB: D1Database;
}

const app = new Hono<{ Bindings: Bindings }>()

// Helper function to ensure safe numeric values for database insertion
function ensureSafeNumber(value: any, defaultValue: number = 0): number {
  const num = Number(value)
  return (isNaN(num) || num === null || num === undefined) ? defaultValue : num
}

// Enable CORS
app.use('/api/*', cors())

// ===== Authentication API =====

// Login
app.post('/api/login', async (c) => {
  try {
    const { username, password } = await c.req.json()
    
    const result = await c.env.DB.prepare(`
      SELECT u.id, u.username, u.full_name, u.region_id, u.position_id, u.start_date,
             r.name as region_name, p.name as position_name, p.display_name as position_display
      FROM users u
      JOIN regions r ON u.region_id = r.id
      JOIN positions p ON u.position_id = p.id
      WHERE u.username = ? AND u.password = ?
    `).bind(username, password).first()
    
    if (!result) {
      return c.json({ error: 'Sai tên đăng nhập hoặc mật khẩu' }, 401)
    }
    
    // Get admin regions if admin user
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
    
    return c.json({ 
      success: true, 
      user: result,
      adminRegions: adminRegions
    })
  } catch (error) {
    return c.json({ error: 'Lỗi đăng nhập' }, 500)
  }
})

// Get KPI templates for a position
app.get('/api/kpi-templates/:positionId', async (c) => {
  try {
    const positionId = c.req.param('positionId')
    const isForKpi = c.req.query('type') === 'level' ? 0 : 1
    
    const results = await c.env.DB.prepare(`
      SELECT id, position_id, kpi_name as name, weight, standard_value, 
             description, is_for_kpi, display_order, created_at
      FROM kpi_templates 
      WHERE position_id = ? AND is_for_kpi = ?
      ORDER BY display_order
    `).bind(positionId, isForKpi).all()
    
    return c.json({ templates: results.results })
  } catch (error) {
    return c.json({ error: 'Lỗi lấy danh sách KPI' }, 500)
  }
})

// Get user's KPI data for a month
app.get('/api/kpi-data/:userId/:year/:month', async (c) => {
  try {
    const userId = c.req.param('userId')
    const year = c.req.param('year')
    const month = c.req.param('month')
    
    const results = await c.env.DB.prepare(`
      SELECT kd.*, kt.kpi_name, kt.weight, kt.standard_value, kt.is_for_kpi
      FROM kpi_data kd
      JOIN kpi_templates kt ON kd.kpi_template_id = kt.id
      WHERE kd.user_id = ? AND kd.year = ? AND kd.month = ?
      ORDER BY kt.is_for_kpi DESC, kt.display_order
    `).bind(userId, year, month).all()
    
    return c.json({ data: results.results })
  } catch (error) {
    return c.json({ error: 'Lỗi lấy dữ liệu KPI' }, 500)
  }
})

// Get KPI templates with revenue plan (for special revenue KPIs)
app.get('/api/kpi-form-data/:userId/:positionId/:year/:month', async (c) => {
  try {
    const userId = c.req.param('userId')
    const positionId = c.req.param('positionId')
    const year = c.req.param('year')
    const month = c.req.param('month')
    const isForKpi = c.req.query('type') === 'level' ? 0 : 1
    
    // Get KPI templates
    const templates = await c.env.DB.prepare(`
      SELECT id, position_id, kpi_name, weight, standard_value, 
             description, is_for_kpi, display_order, created_at
      FROM kpi_templates 
      WHERE position_id = ? AND is_for_kpi = ?
      ORDER BY display_order
    `).bind(positionId, isForKpi).all()
    
    // Get revenue plan for this user and year
    const revenuePlan = await c.env.DB.prepare(`
      SELECT month, planned_revenue 
      FROM revenue_plan 
      WHERE user_id = ? AND year = ?
    `).bind(userId, year).all()
    
    // Create revenue plan map
    const revenuePlanMap = {}
    revenuePlan.results.forEach(p => {
      revenuePlanMap[p.month] = p.planned_revenue
    })
    
    // Get existing KPI data
    const existingData = await c.env.DB.prepare(`
      SELECT kd.*, kt.kpi_name
      FROM kpi_data kd
      JOIN kpi_templates kt ON kd.kpi_template_id = kt.id
      WHERE kd.user_id = ? AND kd.year = ? AND kd.month = ?
    `).bind(userId, year, month).all()
    
    return c.json({ 
      templates: templates.results,
      revenuePlan: revenuePlanMap[parseInt(month)] || null,
      existingData: existingData.results
    })
  } catch (error) {
    return c.json({ error: 'Lỗi lấy dữ liệu form KPI' }, 500)
  }
})

// Get tracking data for all months in a year
app.get('/api/tracking/:userId/:year', async (c) => {
  try {
    const userId = c.req.param('userId')
    const year = c.req.param('year')
    
    // Get user info
    const user = await c.env.DB.prepare(`
      SELECT position_id FROM users WHERE id = ?
    `).bind(userId).first()
    
    if (!user) {
      return c.json({ error: 'Người dùng không tồn tại' }, 404)
    }
    
    // Get KPI templates
    const kpiTemplates = await c.env.DB.prepare(`
      SELECT id, kpi_name, weight, standard_value, display_order
      FROM kpi_templates 
      WHERE position_id = ? AND is_for_kpi = 1
      ORDER BY display_order
    `).bind(user.position_id).all()
    
    // Get Level templates
    const levelTemplates = await c.env.DB.prepare(`
      SELECT id, kpi_name as name, weight, standard_value, display_order
      FROM kpi_templates 
      WHERE position_id = ? AND is_for_kpi = 0
      ORDER BY display_order
    `).bind(user.position_id).all()
    
    // Get all KPI data for the year
    const kpiData = await c.env.DB.prepare(`
      SELECT kd.*, kt.is_for_kpi
      FROM kpi_data kd
      JOIN kpi_templates kt ON kd.kpi_template_id = kt.id
      WHERE kd.user_id = ? AND kd.year = ? AND kt.is_for_kpi = 1
      ORDER BY kd.month, kt.display_order
    `).bind(userId, year).all()
    
    // Get all Level data for the year
    const levelData = await c.env.DB.prepare(`
      SELECT kd.*, kt.is_for_kpi
      FROM kpi_data kd
      JOIN kpi_templates kt ON kd.kpi_template_id = kt.id
      WHERE kd.user_id = ? AND kd.year = ? AND kt.is_for_kpi = 0
      ORDER BY kd.month, kt.display_order
    `).bind(userId, year).all()
    
    return c.json({ 
      kpiData: kpiData.results,
      levelData: levelData.results,
      templates: {
        kpi: kpiTemplates.results,
        level: levelTemplates.results
      }
    })
  } catch (error) {
    return c.json({ error: 'Lỗi lấy dữ liệu tracking' }, 500)
  }
})

// Submit KPI data
app.post('/api/kpi-data', async (c) => {
  try {
    const data = await c.req.json()
    const { userId, year, month, kpiData } = data
    
    // Get user info to check position
    const user = await c.env.DB.prepare(`
      SELECT position_id, start_date FROM users WHERE id = ?
    `).bind(userId).first()
    
    if (!user) {
      return c.json({ error: 'Không tìm thấy user' }, 404)
    }
    
    // Check if month is locked
    const lockCheck = await c.env.DB.prepare(`
      SELECT id FROM lock_months 
      WHERE year = ? AND month = ? AND position_id = ?
    `).bind(year, month, user.position_id).first()
    
    if (lockCheck) {
      return c.json({ 
        error: 'Tháng này đã được duyệt và khóa. Không thể chỉnh sửa!' 
      }, 403)
    }
    
    const isGiamSat = user && user.position_id === 4 // position_id = 4 là Giám sát
    
    // Calculate scores and insert/update
    for (const item of kpiData) {
      const { templateId, actualValue } = item
      
      // Skip if actualValue is invalid
      if (actualValue === undefined || actualValue === null || isNaN(actualValue)) {
        continue
      }
      
      // Get template info
      const template = await c.env.DB.prepare(`
        SELECT * FROM kpi_templates WHERE id = ?
      `).bind(templateId).first()
      
      console.log(`[DEBUG] Processing templateId=${templateId}, is_for_kpi=${template?.is_for_kpi}, kpi_name="${template?.kpi_name}"`)
      
      if (!template) continue
      
      // FOR LEVEL DATA: Try to get actual_value from corresponding KPI first
      let actualValueToUse = actualValue
      
      if (template.is_for_kpi === 0) {
        console.log(`[DEBUG] This is LEVEL data for "${template.kpi_name}"`)
        // This is Level data - try to sync from KPI
        const kpiTemplate = await c.env.DB.prepare(
          'SELECT id FROM kpi_templates WHERE kpi_name = ? AND is_for_kpi = 1'
        ).bind(template.kpi_name).first()
        
        console.log(`[DEBUG] KPI Template found:`, kpiTemplate)
        
        if (kpiTemplate) {
          const kpiData = await c.env.DB.prepare(
            'SELECT actual_value FROM kpi_data WHERE user_id = ? AND year = ? AND month = ? AND kpi_template_id = ?'
          ).bind(userId, year, month, kpiTemplate.id).first()
          
          console.log(`[DEBUG] KPI Data found:`, kpiData)
          
          if (kpiData && kpiData.actual_value !== null) {
            actualValueToUse = kpiData.actual_value
            console.log(`[AUTO-SYNC] Level "${template.kpi_name}": Using KPI value ${actualValueToUse} instead of input ${actualValue}`)
          }
        }
      } else {
        console.log(`[DEBUG] This is KPI data for "${template.kpi_name}"`)
      }
      
      // Adjust actual value based on KPI type
      let adjustedValue = actualValueToUse
      
      // Special case: "Tỷ lệ % doanh thu tăng trưởng" - user inputs total revenue in billions, not percentage
      const isRevenueGrowthKpi = template.kpi_name && template.kpi_name.includes('doanh thu tăng trưởng')
      const isRevenueKpi = template.kpi_name && template.kpi_name.includes('doanh thu') && !template.kpi_name.includes('%')
      const isPercentageKpi = template.kpi_name && (template.kpi_name.includes('Tỷ lệ') || template.kpi_name.includes('tỷ lệ')) && !isRevenueGrowthKpi
      
      if (isRevenueGrowthKpi) {
        // Revenue growth KPI (template 5): User inputs total revenue (20 tỷ), convert to VND
        adjustedValue = actualValueToUse * 1000000000
      } else if (isRevenueKpi) {
        // Revenue KPI: Convert billions (tỷ) to VND
        adjustedValue = actualValueToUse * 1000000000
      } else if (isPercentageKpi) {
        // Percentage KPI: Convert percentage (70) to decimal (0.7)
        adjustedValue = actualValueToUse / 100
      }
      
      // Calculate completion percentage
      let completionPercent = (adjustedValue / template.standard_value) * 100
      // Cap based on KPI vs Level
      const maxPercent = template.is_for_kpi === 1 ? 150 : 160 // KPI max 150%, Level max 160%
      completionPercent = Math.min(completionPercent, maxPercent)
      
      // Calculate weighted score
      const weightedScore = (completionPercent / 100) * template.weight
      
      // Ensure no NaN or null values before inserting
      if (isNaN(completionPercent) || isNaN(weightedScore) || 
          completionPercent === null || weightedScore === null ||
          adjustedValue === null || adjustedValue === undefined) {
        console.error(`Skipping invalid KPI data: templateId=${templateId}, actualValue=${actualValue}, adjustedValue=${adjustedValue}, completionPercent=${completionPercent}, weightedScore=${weightedScore}`)
        continue
      }
      
      // Ensure values are safe numbers
      const safeCompletionPercent = ensureSafeNumber(completionPercent, 0)
      const safeWeightedScore = ensureSafeNumber(weightedScore, 0)
      const safeAdjustedValue = ensureSafeNumber(adjustedValue, 0)
      
      // Insert or update (store the adjusted value with safe numeric values)
      await c.env.DB.prepare(`
        INSERT INTO kpi_data (user_id, month, year, kpi_template_id, actual_value, completion_percent, weighted_score)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(user_id, month, year, kpi_template_id) 
        DO UPDATE SET 
          actual_value = ?,
          completion_percent = ?,
          weighted_score = ?,
          updated_at = CURRENT_TIMESTAMP
      `).bind(
        userId, month, year, templateId, safeAdjustedValue, safeCompletionPercent, safeWeightedScore,
        safeAdjustedValue, safeCompletionPercent, safeWeightedScore
      ).run()
    }
    
    // Auto-fill Level data for positions with revenue tracking
    const hasRevenue = [1, 2, 3, 5].includes(user.position_id); // PTGĐ, GĐKD, TLKD, GĐKDCC
    
    if (hasRevenue) {
      // Get revenue plan for this month
      const revenuePlan = await c.env.DB.prepare(`
        SELECT planned_revenue FROM revenue_plan 
        WHERE user_id = ? AND year = ? AND month = ?
      `).bind(userId, year, month).first()
      
      // Get Level templates for this position
      const levelTemplates = await c.env.DB.prepare(`
        SELECT id, kpi_name, weight, standard_value FROM kpi_templates 
        WHERE position_id = ? AND is_for_kpi = 0
        ORDER BY display_order
      `).bind(user.position_id).all()
      
      if (levelTemplates.results.length >= 2 && revenuePlan) {
        // Level 1: Tổng số doanh thu - Get directly from KPI "Tổng doanh thu thực tế"
        // Find the actual revenue KPI data
        const revenueKpiTemplate = await c.env.DB.prepare(`
          SELECT id FROM kpi_templates 
          WHERE position_id = ? AND is_for_kpi = 1 AND (kpi_name LIKE '%Tổng doanh thu thực tế%' OR kpi_name LIKE '%doanh thu tăng trưởng%')
        `).bind(user.position_id).first()
        
        if (revenueKpiTemplate) {
          // Get the actual revenue input from KPI data (in billions)
          const revenueKpiData = await c.env.DB.prepare(`
            SELECT actual_value FROM kpi_data 
            WHERE user_id = ? AND year = ? AND month = ? AND kpi_template_id = ?
          `).bind(userId, year, month, revenueKpiTemplate.id).first()
          
          if (revenueKpiData && revenueKpiData.actual_value && revenuePlan) {
            // Level 1: Tổng số doanh thu
            // actual_value is stored as VND (e.g., 20e9 for 20 billion)
            // Use it directly
            const actualRevenue = ensureSafeNumber(revenueKpiData.actual_value, 0)
            const levelTemplate1 = levelTemplates.results[0]
            const level1Completion = Math.min((actualRevenue / levelTemplate1.standard_value) * 100, 160)
            const level1Score = (level1Completion / 100) * levelTemplate1.weight
            
            await c.env.DB.prepare(`
              INSERT INTO kpi_data (user_id, month, year, kpi_template_id, actual_value, completion_percent, weighted_score)
              VALUES (?, ?, ?, ?, ?, ?, ?)
              ON CONFLICT(user_id, month, year, kpi_template_id) 
              DO UPDATE SET 
                actual_value = ?,
                completion_percent = ?,
                weighted_score = ?,
                updated_at = CURRENT_TIMESTAMP
            `).bind(
              userId, month, year, levelTemplate1.id,
              ensureSafeNumber(actualRevenue), ensureSafeNumber(level1Completion), ensureSafeNumber(level1Score),
              ensureSafeNumber(actualRevenue), ensureSafeNumber(level1Completion), ensureSafeNumber(level1Score)
            ).run()
            
            // Level 2: Tỷ lệ % doanh thu tăng trưởng - Calculate from actual vs planned
            const levelTemplate2 = levelTemplates.results[1]
            // Calculate growth % = (actual / planned) - 1
            const growthPercent = (actualRevenue / (revenuePlan.planned_revenue * 1000000000)) - 1
            // Convert to percentage and cap at 160%
            const growthPercentValue = Math.min(growthPercent * 100, 160)
            // standard_value is 1.0 (means 100% growth is standard)
            // Completion = (actual_growth / standard_growth) * 100, capped at 160%
            const level2Completion = Math.min((growthPercent / levelTemplate2.standard_value) * 100, 160)
            const level2Score = (level2Completion / 100) * levelTemplate2.weight
            
            await c.env.DB.prepare(`
              INSERT INTO kpi_data (user_id, month, year, kpi_template_id, actual_value, completion_percent, weighted_score)
              VALUES (?, ?, ?, ?, ?, ?, ?)
              ON CONFLICT(user_id, month, year, kpi_template_id) 
              DO UPDATE SET 
                actual_value = ?,
                completion_percent = ?,
                weighted_score = ?,
                updated_at = CURRENT_TIMESTAMP
            `).bind(
              userId, month, year, levelTemplate2.id,
              ensureSafeNumber(growthPercentValue), ensureSafeNumber(level2Completion), ensureSafeNumber(level2Score),
              ensureSafeNumber(growthPercentValue), ensureSafeNumber(level2Completion), ensureSafeNumber(level2Score)
            ).run()
          }
        }
        
        // Level 3: Số lượng cấp giám đốc trở lên đạt chuẩn - Get from KPI
        // Find KPI with "nhân sự" and "đạt chuẩn"
        if (levelTemplates.results.length >= 3) {
          const personnelKpiTemplate = await c.env.DB.prepare(`
            SELECT id FROM kpi_templates 
            WHERE position_id = ? AND is_for_kpi = 1 AND kpi_name LIKE '%nhân sự%' AND kpi_name LIKE '%đạt chuẩn%'
          `).bind(user.position_id).first()
          
          if (personnelKpiTemplate) {
            const personnelKpiData = await c.env.DB.prepare(`
              SELECT actual_value FROM kpi_data 
              WHERE user_id = ? AND year = ? AND month = ? AND kpi_template_id = ?
            `).bind(userId, year, month, personnelKpiTemplate.id).first()
            
            if (personnelKpiData && personnelKpiData.actual_value !== null) {
              const levelTemplate3 = levelTemplates.results[2]
              const level3Completion = Math.min((personnelKpiData.actual_value / levelTemplate3.standard_value) * 100, 160)
              const level3Score = (level3Completion / 100) * levelTemplate3.weight
              
              await c.env.DB.prepare(`
                INSERT INTO kpi_data (user_id, month, year, kpi_template_id, actual_value, completion_percent, weighted_score)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(user_id, month, year, kpi_template_id) 
                DO UPDATE SET 
                  actual_value = ?,
                  completion_percent = ?,
                  weighted_score = ?,
                  updated_at = CURRENT_TIMESTAMP
              `).bind(
                userId, month, year, levelTemplate3.id,
                ensureSafeNumber(personnelKpiData.actual_value), ensureSafeNumber(level3Completion), ensureSafeNumber(level3Score),
                ensureSafeNumber(personnelKpiData.actual_value), ensureSafeNumber(level3Completion), ensureSafeNumber(level3Score)
              ).run()
            }
          }
        }
      }
      
      // Level 4: Số năm thâm niên - Auto-calculate from start_date
      if (user.start_date && levelTemplates.results.length >= 4) {
        const startDate = new Date(user.start_date)
        const now = new Date()
        const yearsOfExperience = (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
        
        const experienceTemplate = levelTemplates.results[3]
        const completionPercent = ensureSafeNumber(Math.min((yearsOfExperience / experienceTemplate.standard_value) * 100, 160), 0)
        const weightedScore = ensureSafeNumber((completionPercent / 100) * experienceTemplate.weight, 0)
        
        // Always insert with safe values
          await c.env.DB.prepare(`
            INSERT INTO kpi_data (user_id, month, year, kpi_template_id, actual_value, completion_percent, weighted_score)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(user_id, month, year, kpi_template_id) 
            DO UPDATE SET 
              actual_value = ?,
              completion_percent = ?,
              weighted_score = ?,
              updated_at = CURRENT_TIMESTAMP
          `).bind(
            userId, month, year, experienceTemplate.id,
            ensureSafeNumber(yearsOfExperience), ensureSafeNumber(completionPercent), ensureSafeNumber(weightedScore),
            ensureSafeNumber(yearsOfExperience), ensureSafeNumber(completionPercent), ensureSafeNumber(weightedScore)
          ).run()
      }
    }
    
    // Nếu là Giám sát, tự động fill Level từ KPI
    if (isGiamSat) {
      // Map KPI template IDs sang Level template IDs cho Giám sát
      const kpiToLevelMap = {
        // KPI ID -> Level ID cho position_id = 4
        // Lấy từ kpi_templates: is_for_kpi=1 -> is_for_kpi=0
        // Template 1: Số lượng lao động tiềm năng tư vấn
        // Template 2: Số lượng lao động mới tuyển dụng
        // Template 3: Số lượng lao động quản lý
      }
      
      // Get KPI templates for Giám sát
      const kpiTemplates = await c.env.DB.prepare(`
        SELECT id, kpi_name FROM kpi_templates 
        WHERE position_id = 4 AND is_for_kpi = 1
        ORDER BY display_order
      `).all()
      
      // Get Level templates for Giám sát  
      const levelTemplates = await c.env.DB.prepare(`
        SELECT id, kpi_name FROM kpi_templates 
        WHERE position_id = 4 AND is_for_kpi = 0
        ORDER BY display_order
      `).all()
      
      // Auto-fill first 3 Level templates from KPI (không bao gồm "Số năm kinh nghiệm")
      for (let i = 0; i < 3 && i < levelTemplates.results.length; i++) {
        const levelTemplate = levelTemplates.results[i]
        
        // Find KPI template with SAME NAME
        const kpiTemplate = await c.env.DB.prepare(`
          SELECT id FROM kpi_templates 
          WHERE position_id = ? AND is_for_kpi = 1 AND kpi_name = ?
        `).bind(user.position_id, levelTemplate.kpi_name).first()
        
        if (!kpiTemplate) {
          console.log(`[Auto-fill Level] No matching KPI found for Level "${levelTemplate.kpi_name}"`)
          continue
        }
        
        // Get KPI data
        const kpiDataRow = await c.env.DB.prepare(`
          SELECT actual_value, completion_percent, weighted_score 
          FROM kpi_data 
          WHERE user_id = ? AND year = ? AND month = ? AND kpi_template_id = ?
        `).bind(userId, year, month, kpiTemplate.id).first()
        
        if (kpiDataRow && levelTemplate) {
          // Validate that KPI data has all required fields
          if (!kpiDataRow.actual_value || !kpiDataRow.completion_percent) {
            continue // Skip if KPI data is incomplete
          }
          
          // Get full Level template info including standard_value
          const levelTemplateInfo = await c.env.DB.prepare(`
            SELECT weight, standard_value FROM kpi_templates WHERE id = ?
          `).bind(levelTemplate.id).first()
          
          // Recalculate completion_percent for Level (max 160%)
          let levelCompletionPercent = (kpiDataRow.actual_value / levelTemplateInfo.standard_value) * 100
          levelCompletionPercent = Math.min(levelCompletionPercent, 160) // Max 160% for Level
          
          // Recalculate weighted_score with Level template's weight
          const newWeightedScore = (levelCompletionPercent / 100) * levelTemplateInfo.weight
          
          // Ensure no NaN values
          if (isNaN(levelCompletionPercent) || isNaN(newWeightedScore)) {
            continue
          }
          
          console.log(`[Auto-fill Level] "${levelTemplate.kpi_name}": actual_value=${kpiDataRow.actual_value}, completion=${levelCompletionPercent.toFixed(2)}%`)
          
          // Insert Level data with 160% max
          await c.env.DB.prepare(`
            INSERT INTO kpi_data (user_id, month, year, kpi_template_id, actual_value, completion_percent, weighted_score)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(user_id, month, year, kpi_template_id) 
            DO UPDATE SET 
              actual_value = ?,
              completion_percent = ?,
              weighted_score = ?,
              updated_at = CURRENT_TIMESTAMP
          `).bind(
            userId, month, year, levelTemplate.id, 
            ensureSafeNumber(kpiDataRow.actual_value), ensureSafeNumber(levelCompletionPercent), ensureSafeNumber(newWeightedScore),
            ensureSafeNumber(kpiDataRow.actual_value), ensureSafeNumber(levelCompletionPercent), ensureSafeNumber(newWeightedScore)
          ).run()
        }
      }
      
      // Tính số năm kinh nghiệm (Level template thứ 4)
      if (user.start_date && levelTemplates.results.length >= 4) {
        const startDate = new Date(user.start_date)
        const now = new Date()
        const yearsOfExperience = (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
        
        const experienceTemplate = levelTemplates.results[3] // "Số năm kinh nghiệm"
        
        // Get full template info with weight
        const expTemplateInfo = await c.env.DB.prepare(`
          SELECT weight, standard_value FROM kpi_templates WHERE id = ?
        `).bind(experienceTemplate.id).first()
        
        if (!expTemplateInfo || !expTemplateInfo.weight || !expTemplateInfo.standard_value) {
          // Skip if template data is incomplete
        } else {
          const completionPercent = ensureSafeNumber(Math.min((yearsOfExperience / expTemplateInfo.standard_value) * 100, 160), 0) // Max 160% for Level
          const weightedScore = ensureSafeNumber((completionPercent / 100) * expTemplateInfo.weight, 0)
          
          // Always insert with safe values
          await c.env.DB.prepare(`
            INSERT INTO kpi_data (user_id, month, year, kpi_template_id, actual_value, completion_percent, weighted_score)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(user_id, month, year, kpi_template_id) 
            DO UPDATE SET 
              actual_value = ?,
              completion_percent = ?,
              weighted_score = ?,
              updated_at = CURRENT_TIMESTAMP
          `).bind(
            userId, month, year, experienceTemplate.id,
            ensureSafeNumber(yearsOfExperience), ensureSafeNumber(completionPercent), ensureSafeNumber(weightedScore),
            ensureSafeNumber(yearsOfExperience), ensureSafeNumber(completionPercent), ensureSafeNumber(weightedScore)
          ).run()
        }
      }
    }
    
    // UNIVERSAL Auto-fill Level from KPI for ALL positions
    console.log(`[Universal Auto-fill] Starting for user ${userId}, position ${user.position_id}`)
    
    const allLevelTemplates = await c.env.DB.prepare(`
      SELECT id, kpi_name, weight, standard_value FROM kpi_templates 
      WHERE position_id = ? AND is_for_kpi = 0
      ORDER BY display_order
    `).bind(user.position_id).all()
    
    for (let i = 0; i < 3 && i < allLevelTemplates.results.length; i++) {
      const levelTemplate = allLevelTemplates.results[i]
      
      const matchingKpi = await c.env.DB.prepare(`
        SELECT id FROM kpi_templates 
        WHERE position_id = ? AND is_for_kpi = 1 AND kpi_name = ?
      `).bind(user.position_id, levelTemplate.kpi_name).first()
      
      if (!matchingKpi) continue
      
      const kpiData = await c.env.DB.prepare(`
        SELECT actual_value FROM kpi_data 
        WHERE user_id = ? AND year = ? AND month = ? AND kpi_template_id = ?
      `).bind(userId, year, month, matchingKpi.id).first()
      
      if (!kpiData || !kpiData.actual_value) continue
      
      const levelCompletion = Math.min((kpiData.actual_value / levelTemplate.standard_value) * 100, 160)
      const levelScore = (levelCompletion / 100) * levelTemplate.weight
      
      console.log(`[Universal Auto-fill] "${levelTemplate.kpi_name}": ${kpiData.actual_value} → ${levelCompletion.toFixed(1)}%`)
      
      await c.env.DB.prepare(`
        INSERT INTO kpi_data (user_id, month, year, kpi_template_id, actual_value, completion_percent, weighted_score)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(user_id, month, year, kpi_template_id) 
        DO UPDATE SET 
          actual_value = ?,
          completion_percent = ?,
          weighted_score = ?,
          updated_at = CURRENT_TIMESTAMP
      `).bind(
        userId, month, year, levelTemplate.id,
        kpiData.actual_value, levelCompletion, levelScore,
        kpiData.actual_value, levelCompletion, levelScore
      ).run()
    }
    
    // Calculate total scores and update monthly_summary
    await calculateMonthlySummary(c.env.DB, userId, year, month)
    
    return c.json({ success: true, message: 'Lưu dữ liệu thành công' })
  } catch (error) {
    console.error('Error saving KPI:', error)
    return c.json({ error: 'Lỗi lưu dữ liệu KPI' }, 500)
  }
})

// Save Level data (manual input)
app.post('/api/level-data', async (c) => {
  try {
    const { userId, year, month, levelData } = await c.req.json()
    
    // Get user info
    const user = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first()
    if (!user) {
      return c.json({ error: 'User not found' }, 404)
    }
    
    // Check if month is locked
    const lockCheck = await c.env.DB.prepare(`
      SELECT id FROM lock_months 
      WHERE year = ? AND month = ? AND position_id = ?
    `).bind(year, month, user.position_id).first()
    
    if (lockCheck) {
      return c.json({ 
        error: 'Tháng này đã được duyệt và khóa. Không thể chỉnh sửa!' 
      }, 403)
    }
    
    // Process each Level input
    for (const item of levelData) {
      const { templateId, actualValue } = item
      
      // Get template info
      const template = await c.env.DB.prepare(
        'SELECT * FROM kpi_templates WHERE id = ?'
      ).bind(templateId).first()
      
      if (!template) continue
      
      // For Level indicators, try to get actual_value from corresponding KPI first
      let actualValueToUse = actualValue
      
      // Find corresponding KPI template with same name
      const kpiTemplate = await c.env.DB.prepare(
        'SELECT id FROM kpi_templates WHERE kpi_name = ? AND is_for_kpi = 1'
      ).bind(template.kpi_name).first()
      
      console.log(`[Level Auto-sync] Template: ${template.kpi_name}, Level templateId: ${templateId}, KPI template found:`, kpiTemplate?.id)
      
      if (kpiTemplate) {
        // Check if KPI data exists for this month
        const kpiData = await c.env.DB.prepare(
          'SELECT actual_value FROM kpi_data WHERE user_id = ? AND year = ? AND month = ? AND kpi_template_id = ?'
        ).bind(userId, year, month, kpiTemplate.id).first()
        
        console.log(`[Level Auto-sync] KPI data found:`, kpiData?.actual_value, `Original input: ${actualValue}`)
        
        if (kpiData && kpiData.actual_value !== null) {
          // Use actual_value from KPI data
          actualValueToUse = kpiData.actual_value
          console.log(`[Level Auto-sync] Using KPI value: ${actualValueToUse}`)
        }
      }
      
      // Adjust input based on indicator type
      let adjustedValue = actualValueToUse
      
      // 1. Tỷ lệ % doanh thu tăng trưởng: input in billions (tỷ), convert to VND (same as KPI)
      const isRevenueGrowthLevel = template.kpi_name && template.kpi_name.includes('doanh thu tăng trưởng')
      
      if (isRevenueGrowthLevel) {
        adjustedValue = actualValueToUse * 1000000000 // Convert tỷ to VND
      }
      // 2. Tổng số doanh thu: input in billions (tỷ), convert to VND
      else if (template.kpi_name.includes('doanh thu') && !template.kpi_name.includes('%')) {
        adjustedValue = actualValueToUse * 1000000000 // Convert tỷ to VND
      }
      // 3. Tỷ lệ % indicators: input is percentage, convert to decimal
      else if ((template.kpi_name.includes('Tỷ lệ %') || template.kpi_name.includes('tỷ lệ %')) && !isRevenueGrowthLevel) {
        adjustedValue = actualValueToUse / 100 // Convert 50 to 0.5
      }
      // 4. Count/years indicators: use as-is
      
      // Calculate completion percent and weighted score
      // Level max is 160% (not 150% like KPI)
      const completionPercent = ensureSafeNumber(Math.min((adjustedValue / template.standard_value) * 100, 160), 0)
      const weightedScore = ensureSafeNumber((completionPercent / 100) * template.weight, 0)
      
      // Insert or update Level data
      await c.env.DB.prepare(`
        INSERT INTO kpi_data (user_id, month, year, kpi_template_id, actual_value, completion_percent, weighted_score)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(user_id, month, year, kpi_template_id) 
        DO UPDATE SET 
          actual_value = ?,
          completion_percent = ?,
          weighted_score = ?,
          updated_at = CURRENT_TIMESTAMP
      `).bind(
        userId, month, year, templateId,
        ensureSafeNumber(adjustedValue), ensureSafeNumber(completionPercent), ensureSafeNumber(weightedScore),
        ensureSafeNumber(adjustedValue), ensureSafeNumber(completionPercent), ensureSafeNumber(weightedScore)
      ).run()
    }
    
    // Calculate total scores and update monthly_summary
    await calculateMonthlySummary(c.env.DB, userId, year, month)
    
    return c.json({ success: true, message: 'Lưu dữ liệu thành công' })
  } catch (error) {
    console.error('Error saving Level:', error)
    return c.json({ error: 'Lỗi lưu dữ liệu Level' }, 500)
  }
})

// Get monthly summary for a user
app.get('/api/summary/:userId/:year/:month', async (c) => {
  try {
    const userId = c.req.param('userId')
    const year = c.req.param('year')
    const month = c.req.param('month')
    
    const summary = await c.env.DB.prepare(`
      SELECT * FROM monthly_summary 
      WHERE user_id = ? AND year = ? AND month = ?
    `).bind(userId, year, month).first()
    
    return c.json({ summary })
  } catch (error) {
    return c.json({ error: 'Lỗi lấy tổng hợp' }, 500)
  }
})

// Get all monthly summaries for a user in a year
app.get('/api/monthly-summary/:userId/:year', async (c) => {
  try {
    const userId = c.req.param('userId')
    const year = c.req.param('year')
    
    const summaries = await c.env.DB.prepare(`
      SELECT * FROM monthly_summary 
      WHERE user_id = ? AND year = ?
      ORDER BY month ASC
    `).bind(userId, year).all()
    
    return c.json({ summaries: summaries.results })
  } catch (error) {
    return c.json({ error: 'Lỗi lấy lịch sử tháng' }, 500)
  }
})

// Get dashboard data (all users, all regions)
app.get('/api/dashboard/:userId/:year/:month', async (c) => {
  try {
    const userId = c.req.param('userId')
    const year = c.req.param('year')
    const month = c.req.param('month')
    
    // Get current user info to determine access level
    const currentUser = await c.env.DB.prepare(`
      SELECT id, username, position_id, region_id FROM users WHERE id = ?
    `).bind(userId).first()
    
    if (!currentUser) {
      return c.json({ error: 'User not found' }, 404)
    }
    
    let query = ''
    let bindings: any[] = []
    
    // Admin: See all users grouped by 4 regions
    if (currentUser.username === 'admin') {
      query = `
        SELECT 
          u.id, u.full_name, u.username,
          u.position_id, u.region_id,
          r.name as region_name,
          p.display_name as position_name,
          ms.total_kpi_score, ms.kpi_level,
          ms.total_level_score, ms.performance_level,
          rp.planned_revenue
        FROM users u
        JOIN regions r ON u.region_id = r.id
        JOIN positions p ON u.position_id = p.id
        LEFT JOIN monthly_summary ms ON u.id = ms.user_id 
          AND ms.year = ? AND ms.month = ?
        LEFT JOIN revenue_plan rp ON u.id = rp.user_id
          AND rp.year = ? AND rp.month = ?
        WHERE u.username NOT IN ('admin', 'admin1', 'admin2', 'admin3')
        ORDER BY r.id, p.id, ms.total_kpi_score DESC NULLS LAST
      `
      bindings = [year, month, year, month]
    }
    // PTGĐ & GĐKDCC (position_id = 1 or 5): See all 5 positions (1,2,3,4,5)
    else if (currentUser.position_id === 1 || currentUser.position_id === 5) {
      query = `
        SELECT 
          u.id, u.full_name, u.username,
          u.position_id, u.region_id,
          r.name as region_name,
          p.display_name as position_name,
          ms.total_kpi_score, ms.kpi_level,
          ms.total_level_score, ms.performance_level,
          rp.planned_revenue
        FROM users u
        JOIN regions r ON u.region_id = r.id
        JOIN positions p ON u.position_id = p.id
        LEFT JOIN monthly_summary ms ON u.id = ms.user_id 
          AND ms.year = ? AND ms.month = ?
        LEFT JOIN revenue_plan rp ON u.id = rp.user_id
          AND rp.year = ? AND rp.month = ?
        WHERE u.position_id IN (1, 2, 3, 4, 5) AND u.username NOT IN ('admin', 'admin1', 'admin2', 'admin3')
        ORDER BY p.id, ms.total_kpi_score DESC NULLS LAST, r.id
      `
      bindings = [year, month, year, month]
    }
    // GĐKD (position_id = 2): See positions 2, 3, 4 (GĐKD, TLKD, GS)
    else if (currentUser.position_id === 2) {
      query = `
        SELECT 
          u.id, u.full_name, u.username,
          u.position_id, u.region_id,
          r.name as region_name,
          p.display_name as position_name,
          ms.total_kpi_score, ms.kpi_level,
          ms.total_level_score, ms.performance_level,
          rp.planned_revenue
        FROM users u
        JOIN regions r ON u.region_id = r.id
        JOIN positions p ON u.position_id = p.id
        LEFT JOIN monthly_summary ms ON u.id = ms.user_id 
          AND ms.year = ? AND ms.month = ?
        LEFT JOIN revenue_plan rp ON u.id = rp.user_id
          AND rp.year = ? AND rp.month = ?
        WHERE u.position_id IN (2, 3, 4)
        ORDER BY p.id, ms.total_kpi_score DESC NULLS LAST, r.id
      `
      bindings = [year, month, year, month]
    }
    // TLKD (position_id = 3): See positions 3, 4 (TLKD, GS)
    else if (currentUser.position_id === 3) {
      query = `
        SELECT 
          u.id, u.full_name, u.username,
          u.position_id, u.region_id,
          r.name as region_name,
          p.display_name as position_name,
          ms.total_kpi_score, ms.kpi_level,
          ms.total_level_score, ms.performance_level,
          rp.planned_revenue
        FROM users u
        JOIN regions r ON u.region_id = r.id
        JOIN positions p ON u.position_id = p.id
        LEFT JOIN monthly_summary ms ON u.id = ms.user_id 
          AND ms.year = ? AND ms.month = ?
        LEFT JOIN revenue_plan rp ON u.id = rp.user_id
          AND rp.year = ? AND rp.month = ?
        WHERE u.position_id IN (3, 4)
        ORDER BY p.id, ms.total_kpi_score DESC NULLS LAST, r.id
      `
      bindings = [year, month, year, month]
    }
    // Giám sát (position_id = 4): See only position 4 (GS)
    else if (currentUser.position_id === 4) {
      query = `
        SELECT 
          u.id, u.full_name, u.username,
          u.position_id, u.region_id,
          r.name as region_name,
          p.display_name as position_name,
          ms.total_kpi_score, ms.kpi_level,
          ms.total_level_score, ms.performance_level,
          rp.planned_revenue
        FROM users u
        JOIN regions r ON u.region_id = r.id
        JOIN positions p ON u.position_id = p.id
        LEFT JOIN monthly_summary ms ON u.id = ms.user_id 
          AND ms.year = ? AND ms.month = ?
        LEFT JOIN revenue_plan rp ON u.id = rp.user_id
          AND rp.year = ? AND rp.month = ?
        WHERE u.position_id = 4
        ORDER BY ms.total_kpi_score DESC NULLS LAST, r.id
      `
      bindings = [year, month, year, month]
    }
    
    const results = await c.env.DB.prepare(query).bind(...bindings).all()
    
    return c.json({ 
      dashboard: results.results,
      isAdmin: currentUser.username === 'admin',
      positionId: currentUser.position_id
    })
  } catch (error) {
    console.error('Dashboard error:', error)
    return c.json({ error: 'Lỗi lấy dashboard' }, 500)
  }
})

// ===== Admin APIs =====

// Get all users (for admin management)
app.get('/api/admin/users', async (c) => {
  try {
    // Get userId from query (from currentUser in frontend)
    const userId = c.req.query('userId')
    const username = c.req.query('username')
    
    let regionFilter = ''
    let allowedRegions = []
    
    // Check if admin and get allowed regions
    if (username && username.startsWith('admin') && userId) {
      const regions = await c.env.DB.prepare(`
        SELECT region_id FROM admin_regions WHERE user_id = ?
      `).bind(userId).all()
      
      allowedRegions = regions.results.map(r => r.region_id)
      
      if (allowedRegions.length > 0 && username !== 'admin') {
        // Filter by allowed regions (not for main admin)
        regionFilter = `AND u.region_id IN (${allowedRegions.join(',')})`
      }
    }
    
    const results = await c.env.DB.prepare(`
      SELECT 
        u.id, u.username, u.full_name, u.employee_id, u.team, u.start_date, u.manager_id,
        r.id as region_id, r.name as region_name,
        p.id as position_id, p.display_name as position_name,
        manager.full_name as manager_name
      FROM users u
      JOIN regions r ON u.region_id = r.id
      JOIN positions p ON u.position_id = p.id
      LEFT JOIN users manager ON u.manager_id = manager.id
      WHERE u.username NOT LIKE 'admin%' ${regionFilter}
      ORDER BY r.id, p.id, u.full_name
    `).all()
    
    return c.json({ users: results.results })
  } catch (error) {
    console.error('Error fetching users:', error)
    return c.json({ error: 'Lỗi lấy danh sách người dùng' }, 500)
  }
})

// Get regions and positions for dropdowns
app.get('/api/admin/metadata', async (c) => {
  try {
    const regions = await c.env.DB.prepare(`
      SELECT id, name FROM regions ORDER BY id
    `).all()
    
    const positions = await c.env.DB.prepare(`
      SELECT id, name, display_name FROM positions ORDER BY id
    `).all()
    
    return c.json({ 
      regions: regions.results,
      positions: positions.results
    })
  } catch (error) {
    return c.json({ error: 'Lỗi lấy metadata' }, 500)
  }
})

// Get admin statistics
app.get('/api/admin/statistics', async (c) => {
  try {
    const userId = c.req.query('userId')
    const username = c.req.query('username')
    
    let regionFilter = ''
    
    // Check if admin and get allowed regions
    if (username && username.startsWith('admin') && userId) {
      const regions = await c.env.DB.prepare(`
        SELECT region_id FROM admin_regions WHERE user_id = ?
      `).bind(userId).all()
      
      const allowedRegions = regions.results.map(r => r.region_id)
      
      if (allowedRegions.length > 0 && username !== 'admin') {
        regionFilter = `AND region_id IN (${allowedRegions.join(',')})`
      }
    }
    
    // Count by position (excluding admins)
    const positionCounts = await c.env.DB.prepare(`
      SELECT p.id, p.display_name, COUNT(u.id) as count
      FROM positions p
      LEFT JOIN users u ON p.id = u.position_id AND u.username NOT LIKE 'admin%' ${regionFilter}
      GROUP BY p.id, p.display_name
      ORDER BY p.id
    `).all()
    
    return c.json({ positionCounts: positionCounts.results })
  } catch (error) {
    console.error('Error fetching statistics:', error)
    return c.json({ error: 'Lỗi lấy thống kê' }, 500)
  }
})

// Get all KPI templates (for reference table)
app.get('/api/admin/kpi-templates', async (c) => {
  try {
    const templates = await c.env.DB.prepare(`
      SELECT kt.id, kt.position_id, p.display_name as position_name,
             kt.kpi_name, kt.weight, kt.standard_value, kt.description,
             kt.is_for_kpi, kt.display_order
      FROM kpi_templates kt
      JOIN positions p ON kt.position_id = p.id
      ORDER BY kt.position_id, kt.is_for_kpi DESC, kt.display_order
    `).all()
    
    return c.json({ templates: templates.results })
  } catch (error) {
    console.error('Error fetching KPI templates:', error)
    return c.json({ error: 'Lỗi lấy KPI templates' }, 500)
  }
})

// Get dashboard data by position for a year (12 months)
app.get('/api/admin/dashboard/:positionIds/:year', async (c) => {
  try {
    const positionIdsStr = c.req.param('positionIds') // e.g., "1,5" or "2"
    const year = c.req.param('year')
    const userId = c.req.query('userId')
    const username = c.req.query('username')
    
    const positionIds = positionIdsStr.split(',').map(id => parseInt(id))
    
    let regionFilter = ''
    
    // Check if admin and get allowed regions
    if (username && username.startsWith('admin') && userId) {
      const regions = await c.env.DB.prepare(`
        SELECT region_id FROM admin_regions WHERE user_id = ?
      `).bind(userId).all()
      
      const allowedRegions = regions.results.map(r => r.region_id)
      
      if (allowedRegions.length > 0 && username !== 'admin') {
        regionFilter = `AND u.region_id IN (${allowedRegions.join(',')})`
      }
    }
    
    // Get all users for these positions
    const users = await c.env.DB.prepare(`
      SELECT u.id, u.full_name, u.username, r.name as region_name
      FROM users u
      JOIN regions r ON u.region_id = r.id
      WHERE u.position_id IN (${positionIds.join(',')}) ${regionFilter}
        AND u.username NOT LIKE 'admin%'
      ORDER BY r.id, u.full_name
    `).all()
    
    // Get KPI templates for these positions
    const templates = await c.env.DB.prepare(`
      SELECT id, kpi_name, weight, standard_value, is_for_kpi, display_order, position_id
      FROM kpi_templates
      WHERE position_id IN (${positionIds.join(',')})
      ORDER BY position_id, is_for_kpi DESC, display_order
    `).all()
    
    // Get monthly summary for all users for the year
    const monthlyData = await c.env.DB.prepare(`
      SELECT user_id, month, 
             total_kpi_score, kpi_level,
             total_level_score, performance_level
      FROM monthly_summary
      WHERE year = ? AND user_id IN (${users.results.map(u => u.id).join(',') || '0'})
    `).bind(year).all()
    
    // Organize data
    const result = {
      users: users.results,
      templates: templates.results,
      monthlyData: monthlyData.results
    }
    
    return c.json(result)
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return c.json({ error: 'Lỗi lấy dữ liệu dashboard' }, 500)
  }
})

// Get KPI detail data for specific KPIs
app.get('/api/admin/kpi-detail/:positionIds/:year/:kpiIds', async (c) => {
  try {
    const positionIdsStr = c.req.param('positionIds')
    const year = c.req.param('year')
    const kpiIdsStr = c.req.param('kpiIds')
    const userId = c.req.query('userId')
    const username = c.req.query('username')
    
    const positionIds = positionIdsStr.split(',').map(id => parseInt(id))
    const kpiIds = kpiIdsStr.split(',').map(id => parseInt(id))
    
    let regionFilter = ''
    
    // Check if admin and get allowed regions
    if (username && username.startsWith('admin') && userId) {
      const regions = await c.env.DB.prepare(`
        SELECT region_id FROM admin_regions WHERE user_id = ?
      `).bind(userId).all()
      
      const allowedRegions = regions.results.map(r => r.region_id)
      
      if (allowedRegions.length > 0 && username !== 'admin') {
        regionFilter = `AND u.region_id IN (${allowedRegions.join(',')})`
      }
    }
    
    // Get users
    const users = await c.env.DB.prepare(`
      SELECT u.id, u.full_name, u.username, r.name as region_name
      FROM users u
      JOIN regions r ON u.region_id = r.id
      WHERE u.position_id IN (${positionIds.join(',')}) ${regionFilter}
        AND u.username NOT LIKE 'admin%'
      ORDER BY r.id, u.full_name
    `).all()
    
    // Get KPI templates
    const kpiTemplates = await c.env.DB.prepare(`
      SELECT id, kpi_name, weight, standard_value, is_for_kpi
      FROM kpi_templates
      WHERE id IN (${kpiIds.join(',')})
      ORDER BY display_order
    `).all()
    
    // Get KPI data for all users for the year
    const kpiData = await c.env.DB.prepare(`
      SELECT user_id, kpi_template_id, month, actual_value
      FROM kpi_data
      WHERE year = ? 
        AND user_id IN (${users.results.map(u => u.id).join(',') || '0'})
        AND kpi_template_id IN (${kpiIds.join(',')})
      ORDER BY user_id, kpi_template_id, month
    `).bind(year).all()
    
    const result = {
      users: users.results,
      kpiTemplates: kpiTemplates.results,
      kpiData: kpiData.results
    }
    
    return c.json(result)
  } catch (error) {
    console.error('Error fetching KPI detail data:', error)
    return c.json({ error: 'Lỗi lấy dữ liệu KPI chi tiết' }, 500)
  }
})

// Get revenue plan for all users with revenue-related positions
app.get('/api/admin/revenue-plan/:year', async (c) => {
  try {
    const year = c.req.param('year')
    const userId = c.req.query('userId')
    const username = c.req.query('username')
    
    let regionFilter = ''
    
    // Check if admin and get allowed regions
    if (username && username.startsWith('admin') && userId) {
      const regions = await c.env.DB.prepare(`
        SELECT region_id FROM admin_regions WHERE user_id = ?
      `).bind(userId).all()
      
      const allowedRegions = regions.results.map(r => r.region_id)
      
      if (allowedRegions.length > 0 && username !== 'admin') {
        regionFilter = `AND u.region_id IN (${allowedRegions.join(',')})`
      }
    }
    
    // Get users with revenue positions (PTGĐ, GĐKDCC, GĐKD, TLKD)
    const users = await c.env.DB.prepare(`
      SELECT u.id, u.full_name, u.username, 
             r.name as region_name, 
             p.display_name as position_name
      FROM users u
      JOIN regions r ON u.region_id = r.id
      JOIN positions p ON u.position_id = p.id
      WHERE u.position_id IN (1, 2, 3, 5) ${regionFilter}
        AND u.username NOT LIKE 'admin%'
      ORDER BY r.id, p.id, u.full_name
    `).all()
    
    // Get existing plans
    const plans = await c.env.DB.prepare(`
      SELECT user_id, month, planned_revenue
      FROM revenue_plan
      WHERE year = ? AND user_id IN (${users.results.map(u => u.id).join(',') || '0'})
    `).bind(year).all()
    
    return c.json({
      users: users.results,
      plans: plans.results
    })
  } catch (error) {
    console.error('Error fetching revenue plan:', error)
    return c.json({ error: 'Lỗi lấy kế hoạch doanh thu' }, 500)
  }
})

// Save revenue plan
app.post('/api/admin/revenue-plan', async (c) => {
  try {
    const body = await c.req.json()
    const { user_id, year, plans } = body
    
    if (!user_id || !year || !plans || !Array.isArray(plans)) {
      return c.json({ error: 'Thiếu thông tin bắt buộc' }, 400)
    }
    
    // Delete existing plans for this user/year
    await c.env.DB.prepare(`
      DELETE FROM revenue_plan WHERE user_id = ? AND year = ?
    `).bind(user_id, year).run()
    
    // Insert new plans
    for (const plan of plans) {
      if (plan.planned_revenue > 0) {
        await c.env.DB.prepare(`
          INSERT INTO revenue_plan (user_id, year, month, planned_revenue)
          VALUES (?, ?, ?, ?)
        `).bind(user_id, year, plan.month, plan.planned_revenue).run()
      }
    }
    
    return c.json({ success: true, message: 'Lưu kế hoạch thành công' })
  } catch (error) {
    console.error('Error saving revenue plan:', error)
    return c.json({ error: 'Lỗi lưu kế hoạch doanh thu' }, 500)
  }
})

// Get potential managers for a position
app.get('/api/admin/potential-managers/:regionId/:positionId', async (c) => {
  try {
    const regionId = c.req.param('regionId')
    const positionId = parseInt(c.req.param('positionId'))
    
    // Determine which position can be manager
    // Position 4 (Giám sát) -> manager is Position 3 (Trợ lý)
    // Position 3 (Trợ lý) -> manager is Position 2 (GĐKD)
    // Position 2 (GĐKD) -> manager is Position 1 (PTGĐ)
    // Position 1 (PTGĐ) -> no manager (NULL)
    
    let managerPositionId = null
    if (positionId === 4) managerPositionId = 3
    else if (positionId === 3) managerPositionId = 2
    else if (positionId === 2) managerPositionId = 1
    
    if (!managerPositionId) {
      return c.json({ managers: [] })
    }
    
    const results = await c.env.DB.prepare(`
      SELECT id, full_name, username
      FROM users
      WHERE region_id = ? AND position_id = ? AND username NOT IN ('admin', 'admin1', 'admin2', 'admin3')
      ORDER BY full_name
    `).bind(regionId, managerPositionId).all()
    
    return c.json({ managers: results.results })
  } catch (error) {
    return c.json({ error: 'Lỗi lấy danh sách quản lý' }, 500)
  }
})

// Create new user (admin only)
app.post('/api/admin/users', async (c) => {
  try {
    const body = await c.req.json()
    // Support both camelCase and snake_case
    const username = body.username
    const password = body.password
    const full_name = body.fullName || body.full_name
    const region_id = body.regionId || body.region_id
    const position_id = body.positionId || body.position_id
    const start_date = body.startDate || body.start_date
    const team = body.team || null
    
    // Check if username already exists
    const existing = await c.env.DB.prepare(`
      SELECT id FROM users WHERE username = ?
    `).bind(username).first()
    
    if (existing) {
      return c.json({ error: 'Tên đăng nhập đã tồn tại' }, 400)
    }
    
    // Insert new user
    const result = await c.env.DB.prepare(`
      INSERT INTO users (username, password, full_name, region_id, position_id, start_date, team)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(username, password, full_name, region_id, position_id, start_date, team).run()
    
    return c.json({ 
      success: true, 
      message: 'Tạo tài khoản thành công',
      userId: result.meta.last_row_id
    })
  } catch (error) {
    console.error('Error creating user:', error)
    return c.json({ error: 'Lỗi tạo tài khoản' }, 500)
  }
})

// Update user info (admin only)
app.put('/api/admin/users/:userId', async (c) => {
  try {
    const userId = c.req.param('userId')
    const body = await c.req.json()
    
    // Build dynamic update query
    const updates = []
    const bindings = []
    
    // Full name
    if (body.full_name || body.fullName) {
      updates.push('full_name = ?')
      bindings.push(body.full_name || body.fullName)
    }
    
    // Password (optional - only update if provided)
    if (body.password && body.password.trim() !== '') {
      updates.push('password = ?')
      bindings.push(body.password)
    }
    
    // Region
    if (body.region_id || body.regionId) {
      updates.push('region_id = ?')
      bindings.push(body.region_id || body.regionId)
    }
    
    // Position
    if (body.position_id || body.positionId) {
      updates.push('position_id = ?')
      bindings.push(body.position_id || body.positionId)
    }
    
    // Team
    if (body.hasOwnProperty('team')) {
      updates.push('team = ?')
      bindings.push(body.team || null)
    }
    
    // Start date
    if (body.start_date || body.startDate) {
      updates.push('start_date = ?')
      bindings.push(body.start_date || body.startDate)
    }
    
    // Cover image URL
    if (body.hasOwnProperty('cover_image_url')) {
      updates.push('cover_image_url = ?')
      bindings.push(body.cover_image_url || null)
    }
    
    if (updates.length === 0) {
      return c.json({ error: 'Không có thông tin để cập nhật' }, 400)
    }
    
    // Add userId at the end
    bindings.push(userId)
    
    const query = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`
    await c.env.DB.prepare(query).bind(...bindings).run()
    
    return c.json({ success: true, message: 'Cập nhật thành công' })
  } catch (error) {
    console.error('Error updating user:', error)
    return c.json({ error: 'Lỗi cập nhật thông tin' }, 500)
  }
})

// Delete user (admin only)
app.delete('/api/admin/users/:userId', async (c) => {
  try {
    const userId = c.req.param('userId')
    
    // Check if user has subordinates
    const subordinates = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM users WHERE manager_id = ?
    `).bind(userId).first()
    
    if (subordinates && subordinates.count > 0) {
      return c.json({ error: 'Không thể xóa vì còn nhân viên cấp dưới' }, 400)
    }
    
    // Delete user's KPI data first
    await c.env.DB.prepare(`
      DELETE FROM kpi_data WHERE user_id = ?
    `).bind(userId).run()
    
    // Delete user's monthly summary
    await c.env.DB.prepare(`
      DELETE FROM monthly_summary WHERE user_id = ?
    `).bind(userId).run()
    
    // Delete user
    await c.env.DB.prepare(`
      DELETE FROM users WHERE id = ?
    `).bind(userId).run()
    
    return c.json({ success: true, message: 'Xóa tài khoản thành công' })
  } catch (error) {
    console.error('Error deleting user:', error)
    return c.json({ error: 'Lỗi xóa tài khoản' }, 500)
  }
})

// Upload user cover file (multipart/form-data)
app.post('/api/users/upload-cover', async (c) => {
  try {
    const formData = await c.req.formData()
    const file = formData.get('file') as File
    const userId = formData.get('userId') as string

    if (!file) {
      return c.json({ error: 'Không có file được upload' }, 400)
    }

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf']
    if (!validTypes.includes(file.type)) {
      return c.json({ error: 'Định dạng file không hợp lệ. Chỉ chấp nhận PNG, JPG hoặc PDF' }, 400)
    }

    // Validate file size (2MB max for base64 to avoid stack overflow)
    const maxSize = 2 * 1024 * 1024
    if (file.size > maxSize) {
      return c.json({ error: 'File quá lớn. Vui lòng chọn file nhỏ hơn 2MB hoặc sử dụng URL từ GenSpark AI Drive' }, 400)
    }

    // Convert file to base64 data URL using chunked approach to avoid stack overflow
    const arrayBuffer = await file.arrayBuffer()
    const bytes = new Uint8Array(arrayBuffer)
    
    // Convert to base64 in chunks to avoid Maximum call stack size exceeded
    let base64 = ''
    const chunkSize = 8192
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.slice(i, i + chunkSize)
      base64 += String.fromCharCode.apply(null, Array.from(chunk))
    }
    base64 = btoa(base64)
    
    const dataUrl = `data:${file.type};base64,${base64}`

    // Update user's cover_image_url
    await c.env.DB.prepare(`
      UPDATE users 
      SET cover_image_url = ?
      WHERE id = ?
    `).bind(dataUrl, userId).run()

    return c.json({ 
      success: true, 
      message: 'Upload thành công',
      coverUrl: dataUrl
    })
  } catch (error) {
    console.error('Error uploading cover:', error)
    return c.json({ error: `Lỗi upload file: ${error.message}` }, 500)
  }
})

// Update user's own cover image (non-admin)
app.put('/api/users/:userId/cover', async (c) => {
  try {
    const userId = c.req.param('userId')
    const body = await c.req.json()
    
    if (!body.cover_image_url) {
      return c.json({ error: 'Thiếu URL ảnh cover' }, 400)
    }

    await c.env.DB.prepare(`
      UPDATE users 
      SET cover_image_url = ?
      WHERE id = ?
    `).bind(body.cover_image_url, userId).run()

    return c.json({ success: true, message: 'Cập nhật ảnh cover thành công' })
  } catch (error) {
    console.error('Error updating cover:', error)
    return c.json({ error: 'Lỗi cập nhật ảnh cover' }, 500)
  }
})

// Helper function to calculate monthly summary
async function calculateMonthlySummary(db: D1Database, userId: number, year: number, month: number) {
  // Get user position
  const user = await db.prepare('SELECT position_id FROM users WHERE id = ?').bind(userId).first()
  const positionId = user?.position_id || 0
  
  // Calculate KPI score
  const kpiScore = await db.prepare(`
    SELECT SUM(weighted_score) as total
    FROM kpi_data kd
    JOIN kpi_templates kt ON kd.kpi_template_id = kt.id
    WHERE kd.user_id = ? AND kd.year = ? AND kd.month = ? AND kt.is_for_kpi = 1
  `).bind(userId, year, month).first()
  
  const totalKpiScore = kpiScore?.total || 0
  
  // Determine KPI level based on score percentage
  // totalKpiScore = weighted score (0-1.5 range)
  // Convert to percentage: totalKpiScore * 100 (0-150%)
  const kpiPercent = totalKpiScore * 100
  let kpiLevel = 'Cần Cải Thiện'
  if (kpiPercent >= 120) kpiLevel = 'Xuất sắc'
  else if (kpiPercent >= 90) kpiLevel = 'Giỏi'
  else if (kpiPercent >= 70) kpiLevel = 'Khá'
  else if (kpiPercent >= 50) kpiLevel = 'Trung Bình'
  
  // Calculate Level score
  const levelScore = await db.prepare(`
    SELECT SUM(weighted_score) as total
    FROM kpi_data kd
    JOIN kpi_templates kt ON kd.kpi_template_id = kt.id
    WHERE kd.user_id = ? AND kd.year = ? AND kd.month = ? AND kt.is_for_kpi = 0
  `).bind(userId, year, month).first()
  
  const totalLevelScore = levelScore?.total || 0
  const levelPercent = totalLevelScore * 100
  
  // Determine performance level based on position and score
  // Based on xep loai level.xlsx - Different thresholds per position
  let performanceLevel = 'Xem xét lại'
  
  if (positionId === 1 || positionId === 5) {
    // PTGĐ & GĐKDCC
    if (levelPercent >= 155) performanceLevel = 'Level 4'
    else if (levelPercent >= 131) performanceLevel = 'Level 3'
    else if (levelPercent > 100) performanceLevel = 'Level 2'
    else if (levelPercent >= 50) performanceLevel = 'Level 1'
  } else if (positionId === 2 || positionId === 3) {
    // GĐKD & Trợ lý KD
    if (levelPercent >= 140) performanceLevel = 'Level 5'
    else if (levelPercent >= 121) performanceLevel = 'Level 4'
    else if (levelPercent >= 101) performanceLevel = 'Level 3'
    else if (levelPercent >= 81) performanceLevel = 'Level 2'
    else if (levelPercent >= 50) performanceLevel = 'Level 1'
  } else if (positionId === 4) {
    // Giám sát
    if (levelPercent >= 150) performanceLevel = 'Level 5'
    else if (levelPercent >= 131) performanceLevel = 'Level 4'
    else if (levelPercent >= 101) performanceLevel = 'Level 3'
    else if (levelPercent >= 76) performanceLevel = 'Level 2'
    else if (levelPercent >= 50) performanceLevel = 'Level 1'
  } else {
    // Default fallback (PTGĐ logic)
    if (levelPercent >= 155) performanceLevel = 'Level 4'
    else if (levelPercent >= 131) performanceLevel = 'Level 3'
    else if (levelPercent > 100) performanceLevel = 'Level 2'
    else if (levelPercent >= 50) performanceLevel = 'Level 1'
  }
  
  // Insert or update summary
  await db.prepare(`
    INSERT INTO monthly_summary (user_id, month, year, total_kpi_score, kpi_level, total_level_score, performance_level)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id, month, year)
    DO UPDATE SET
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

// ===== Frontend Routes =====

// Main page
app.get('/', (c) => {
  // Prevent caching
  c.header('Cache-Control', 'no-cache, no-store, must-revalidate')
  c.header('Pragma', 'no-cache')
  c.header('Expires', '0')
  
  return c.html(`
    <!DOCTYPE html>
    <html lang="vi">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <title>Hệ thống KPI - Công ty Nhân Kiệt</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
        <script src="https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js"></script>
        <style>
          /* Mobile-first CSS */
          * {
            -webkit-tap-highlight-color: transparent;
          }
          
          body {
            overscroll-behavior-y: none;
          }
          
          /* Hide scrollbar but keep functionality */
          ::-webkit-scrollbar {
            width: 0px;
            height: 0px;
          }
          
          /* Smooth scrolling */
          html {
            scroll-behavior: smooth;
          }
          
          /* Touch-friendly inputs */
          input, select, textarea, button {
            font-size: 16px !important; /* Prevent zoom on iOS */
          }
          
          @media (min-width: 768px) {
            input, select, textarea {
              font-size: 14px !important;
            }
          }
          
          /* Force single column on mobile for dashboard */
          @media (max-width: 767px) {
            .dashboard-grid {
              display: flex !important;
              flex-direction: column !important;
              gap: 1rem !important;
            }
            
            .dashboard-grid > div {
              width: 100% !important;
            }
          }
        </style>
    </head>
    <body class="bg-gray-50">
        <div id="app"></div>
        
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/app.js?v=${Date.now()}"></script>
    </body>
    </html>
  `)
})

// Get recruitment chart data for Giám sát
app.get('/api/recruitment-chart/:year/:month', async (c) => {
  try {
    const year = c.req.param('year')
    const month = c.req.param('month')
    
    // KPI template ID 32: "Số lượng lao động mới tuyển dụng nhận việc mỗi tháng"
    // Standard value: 40
    const results = await c.env.DB.prepare(`
      SELECT 
        u.id,
        u.full_name,
        u.username,
        r.name as region_name,
        kd.actual_value,
        kd.completion_percent,
        kt.standard_value
      FROM users u
      JOIN regions r ON u.region_id = r.id
      LEFT JOIN kpi_data kd ON u.id = kd.user_id 
        AND kd.year = ? AND kd.month = ?
        AND kd.kpi_template_id = 32
      LEFT JOIN kpi_templates kt ON kt.id = 32
      WHERE u.position_id = 4
      ORDER BY kd.actual_value DESC NULLS LAST, u.full_name
    `).bind(year, month).all()
    
    return c.json({ 
      data: results.results,
      standard: 40,
      year: parseInt(year),
      month: parseInt(month)
    })
  } catch (error) {
    console.error('Recruitment chart error:', error)
    return c.json({ error: 'Lỗi lấy dữ liệu biểu đồ' }, 500)
  }
})

// Admin API: Recalculate Level for a user
app.post('/api/admin/recalc-level/:userId', async (c) => {
  try {
    const userId = parseInt(c.req.param('userId'))
    
    // Get user info
    const user = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first()
    if (!user) {
      return c.json({ error: 'User not found' }, 404)
    }
    
    // Get all months with KPI data
    const months = await c.env.DB.prepare(`
      SELECT DISTINCT month, year 
      FROM kpi_data 
      WHERE user_id = ? AND kpi_template_id IN (SELECT id FROM kpi_templates WHERE is_for_kpi = 1)
      ORDER BY year, month
    `).bind(userId).all()
    
    let processed = 0
    
    for (const row of months.results) {
      const { month, year } = row
      
      // Delete existing Level data for this month
      await c.env.DB.prepare(`
        DELETE FROM kpi_data 
        WHERE user_id = ? AND year = ? AND month = ? 
        AND kpi_template_id IN (SELECT id FROM kpi_templates WHERE is_for_kpi = 0)
      `).bind(userId, year, month).run()
      
      // Get Level templates
      const levelTemplates = await c.env.DB.prepare(`
        SELECT id, kpi_name, weight, standard_value 
        FROM kpi_templates 
        WHERE position_id = ? AND is_for_kpi = 0
        ORDER BY display_order
      `).bind(user.position_id).all()
      
      // Auto-fill Level from KPI (first 3 templates only)
      for (let i = 0; i < 3 && i < levelTemplates.results.length; i++) {
        const levelTemplate = levelTemplates.results[i]
        
        // Find KPI template with SAME NAME
        const kpiTemplate = await c.env.DB.prepare(`
          SELECT id FROM kpi_templates 
          WHERE position_id = ? AND is_for_kpi = 1 AND kpi_name = ?
        `).bind(user.position_id, levelTemplate.kpi_name).first()
        
        if (!kpiTemplate) continue
        
        // Get KPI data
        const kpiDataRow = await c.env.DB.prepare(`
          SELECT actual_value 
          FROM kpi_data 
          WHERE user_id = ? AND year = ? AND month = ? AND kpi_template_id = ?
        `).bind(userId, year, month, kpiTemplate.id).first()
        
        if (kpiDataRow && kpiDataRow.actual_value !== null) {
          // Recalculate completion_percent for Level (max 160%)
          let levelCompletionPercent = (kpiDataRow.actual_value / levelTemplate.standard_value) * 100
          levelCompletionPercent = Math.min(levelCompletionPercent, 160)
          
          // Recalculate weighted_score
          const newWeightedScore = (levelCompletionPercent / 100) * levelTemplate.weight
          
          // Insert Level data
          await c.env.DB.prepare(`
            INSERT INTO kpi_data (user_id, month, year, kpi_template_id, actual_value, completion_percent, weighted_score)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `).bind(
            userId, month, year, levelTemplate.id,
            kpiDataRow.actual_value, levelCompletionPercent, newWeightedScore
          ).run()
        }
      }
      
      // Recalculate monthly summary
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
    console.error('Error recalculating Level:', error)
    return c.json({ error: 'Failed to recalculate Level' }, 500)
  }
})

// ===== CHANGE PASSWORD API =====
app.post('/api/change-password', async (c) => {
  try {
    const { userId, oldPassword, newPassword } = await c.req.json()
    
    if (!userId || !oldPassword || !newPassword) {
      return c.json({ error: 'Thiếu thông tin' }, 400)
    }
    
    if (newPassword.length < 6) {
      return c.json({ error: 'Mật khẩu mới phải có ít nhất 6 ký tự' }, 400)
    }
    
    // Verify old password
    const user = await c.env.DB.prepare('SELECT id, password FROM users WHERE id = ?')
      .bind(userId).first()
    
    if (!user) {
      return c.json({ error: 'Không tìm thấy user' }, 404)
    }
    
    // Check old password (simple comparison - in production use bcrypt)
    if (user.password && user.password !== oldPassword) {
      return c.json({ error: 'Mật khẩu cũ không đúng' }, 401)
    }
    
    // Update password
    await c.env.DB.prepare('UPDATE users SET password = ? WHERE id = ?')
      .bind(newPassword, userId).run()
    
    return c.json({ success: true, message: 'Đổi mật khẩu thành công' })
  } catch (error) {
    console.error('Change password error:', error)
    return c.json({ error: 'Lỗi đổi mật khẩu' }, 500)
  }
})

// ===== LOCK/UNLOCK MONTH APIs (Admin only) =====

// Get lock status for a month
app.get('/api/admin/lock-status/:year/:month/:positionId', async (c) => {
  try {
    const year = parseInt(c.req.param('year'))
    const month = parseInt(c.req.param('month'))
    const positionId = parseInt(c.req.param('positionId'))
    
    const lock = await c.env.DB.prepare(`
      SELECT lm.*, u.full_name as locked_by_name
      FROM lock_months lm
      LEFT JOIN users u ON lm.locked_by = u.id
      WHERE lm.year = ? AND lm.month = ? AND lm.position_id = ?
    `).bind(year, month, positionId).first()
    
    return c.json({ 
      isLocked: !!lock,
      lock: lock || null
    })
  } catch (error) {
    console.error('Get lock status error:', error)
    return c.json({ error: 'Lỗi lấy trạng thái khóa' }, 500)
  }
})

// Lock a month (approve)
app.post('/api/admin/lock-month', async (c) => {
  try {
    const { year, month, positionId, userId, notes } = await c.req.json()
    
    if (!year || !month || !positionId || !userId) {
      return c.json({ error: 'Thiếu thông tin' }, 400)
    }
    
    // Check if already locked
    const existing = await c.env.DB.prepare(
      'SELECT id FROM lock_months WHERE year = ? AND month = ? AND position_id = ?'
    ).bind(year, month, positionId).first()
    
    if (existing) {
      return c.json({ error: 'Tháng này đã được duyệt' }, 400)
    }
    
    // Insert lock record
    await c.env.DB.prepare(`
      INSERT INTO lock_months (year, month, position_id, locked_by, notes)
      VALUES (?, ?, ?, ?, ?)
    `).bind(year, month, positionId, userId, notes || '').run()
    
    return c.json({ 
      success: true, 
      message: `Đã duyệt và khóa tháng ${month}/${year}` 
    })
  } catch (error) {
    console.error('Lock month error:', error)
    return c.json({ error: 'Lỗi khóa tháng' }, 500)
  }
})

// Unlock a month
app.post('/api/admin/unlock-month', async (c) => {
  try {
    const { year, month, positionId } = await c.req.json()
    
    if (!year || !month || !positionId) {
      return c.json({ error: 'Thiếu thông tin' }, 400)
    }
    
    await c.env.DB.prepare(
      'DELETE FROM lock_months WHERE year = ? AND month = ? AND position_id = ?'
    ).bind(year, month, positionId).run()
    
    return c.json({ 
      success: true, 
      message: `Đã mở khóa tháng ${month}/${year}` 
    })
  } catch (error) {
    console.error('Unlock month error:', error)
    return c.json({ error: 'Lỗi mở khóa tháng' }, 500)
  }
})

// Get all locked months for admin dashboard
app.get('/api/admin/locked-months/:year', async (c) => {
  try {
    const year = parseInt(c.req.param('year'))
    
    const locks = await c.env.DB.prepare(`
      SELECT lm.*, p.display_name as position_name, u.full_name as locked_by_name
      FROM lock_months lm
      LEFT JOIN positions p ON lm.position_id = p.id
      LEFT JOIN users u ON lm.locked_by = u.id
      WHERE lm.year = ?
      ORDER BY lm.month DESC, lm.position_id
    `).bind(year).all()
    
    return c.json({ locks: locks.results })
  } catch (error) {
    console.error('Get locked months error:', error)
    return c.json({ error: 'Lỗi lấy danh sách tháng đã khóa' }, 500)
  }
})

// Serve static files (app.js, style.css, etc.) - MUST be last to not override API routes
// Note: serveStatic with manifest only works in production, will throw error for .ico in dev
app.use('/*', async (c, next) => {
  try {
    return await serveStatic({ root: './' })(c, next);
  } catch (e) {
    // Fallback for dev mode when __STATIC_CONTENT_MANIFEST not available
    return c.notFound();
  }
})

export default app
