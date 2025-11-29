import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

// Cache để tránh scrape quá nhiều
let cachedData: ReservoirData[] | null = null;
let cacheTime: number | null = null;
const CACHE_DURATION = 30 * 60 * 1000; // 30 phút

interface ReservoirData {
  name: string;           // Tên hồ
  htl: number | null;     // Mực nước hiện tại (m)
  hdbt: number | null;    // Mực nước dâng bình thường (m)
  hc: number | null;      // Mực nước chết (m)
  qve: number | null;     // Lưu lượng đến hồ (m³/s)
  totalQx: number | null; // Tổng lượng xả (m³/s)
  qxt: number | null;     // Xả turbine (m³/s)
  qxm: number | null;     // Xả mặt (m³/s)
  ncxs: number | null;    // Số cửa xả sâu đang mở
  ncxm: number | null;    // Số cửa xả mặt đang mở
  updatedAt: string;      // Thời gian cập nhật
}

function parseNumber(value: string): number | null {
  if (!value || value === '-' || value === '') return null;
  const num = parseFloat(value.replace(',', '.').trim());
  return isNaN(num) ? null : num;
}

export async function GET() {
  try {
    // Bước 1: Kiểm tra DB cache từ backend (cache 1 ngày)
    try {
      const backendRes = await fetch('http://localhost:8000/api/evn-reservoirs/today', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (backendRes.ok) {
        const backendData = await backendRes.json();

        // Nếu có data ngày hôm nay trong DB -> trả về luôn
        if (backendData.cached && backendData.count > 0) {
          console.log(`✓ EVN: Using DB cache - ${backendData.count} reservoirs`);

          // Convert field names from backend (snake_case) to frontend (camelCase)
          const convertedData: ReservoirData[] = backendData.data.map((r: any) => ({
            name: r.name,
            htl: r.htl,
            hdbt: r.hdbt,
            hc: r.hc,
            qve: r.qve,
            totalQx: r.total_qx,
            qxt: r.qxt,
            qxm: r.qxm,
            ncxs: r.ncxs,
            ncxm: r.ncxm,
            basin: r.basin,
            water_percent: r.water_percent,
            updatedAt: r.fetched_at || new Date().toISOString()
          }));

          // Update memory cache
          cachedData = convertedData;
          cacheTime = Date.now();

          return NextResponse.json({
            data: convertedData,
            cached: true,
            from_db: true,
            cachedAt: backendData.fetched_at,
            count: convertedData.length,
            source: 'DB Cache (1 day)'
          });
        }
      }
    } catch (backendError) {
      console.log('EVN: Backend not available, will scrape from EVN');
    }

    // Bước 2: Kiểm tra memory cache (30 phút)
    if (cachedData && cacheTime && (Date.now() - cacheTime) < CACHE_DURATION) {
      return NextResponse.json({
        data: cachedData,
        cached: true,
        cachedAt: new Date(cacheTime).toISOString(),
        count: cachedData.length
      });
    }

    // Bước 3: Scrape dữ liệu mới từ EVN
    console.log('EVN: Scraping fresh data...');
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // Set user agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

    // Đi đến trang EVN
    await page.goto('https://hochuathuydien.evn.com.vn/PageHoChuaThuyDienEmbedEVN.aspx', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // Chờ bảng dữ liệu load
    await page.waitForSelector('table', { timeout: 15000 });

    // Thêm delay để đợi AJAX load xong
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Scrape dữ liệu từ bảng
    const reservoirs = await page.evaluate(() => {
      const data: any[] = [];
      const tables = document.querySelectorAll('table');

      tables.forEach(table => {
        const rows = table.querySelectorAll('tr');

        rows.forEach((row, index) => {
          // Bỏ qua header rows (thường 2-3 rows đầu)
          if (index < 2) return;

          const cells = row.querySelectorAll('td');
          // Bảng EVN có thể có 11+ cột
          if (cells.length < 10) return;

          // Lấy text từ từng cell
          const getText = (cell: Element | undefined) => {
            if (!cell) return '';
            return cell.textContent?.trim() || '';
          };

          // Xác định cột chứa tên hồ và offset
          // Cấu trúc EVN: [Tên+timestamp, Ngày, Htl, Hdbt, Hc, Qve, ΣQx, Qxt, Qxm, Ncxs, Ncxm]
          // Hoặc: [Tên+timestamp, Htl, Hdbt, Hc, Qve, ΣQx, Qxt, Qxm, Ncxs, Ncxm]

          // Tên hồ luôn ở cột 0
          let name = getText(cells[0]);
          name = name.replace(/Đồng bộ lúc:.*$/i, '').trim();

          if (!name || name === '' || name.toLowerCase().includes('tổng') || name.toLowerCase().includes('stt')) return;

          // Kiểm tra nếu tên hồ có vẻ là số thì bỏ qua
          if (/^\d+\.?\d*$/.test(name)) return;

          // Bảng EVN có cấu trúc cố định:
          // [0] Tên hồ + timestamp
          // [1] Ngày (1-31)
          // [2] Htl - Mực nước hiện tại
          // [3] Hdbt - Mực nước dâng bình thường
          // [4] Hc - Mực nước chết
          // [5] Qve - Lưu lượng đến
          // [6] ΣQx - Tổng lượng xả
          // [7] Qxt - Xả turbine
          // [8] Qxm - Xả mặt
          // [9] Ncxs - Số cửa xả sâu
          // [10] Ncxm - Số cửa xả mặt

          // Luôn bắt đầu từ cột 2 vì cột 1 là ngày
          data.push({
            name: name,
            htl: getText(cells[2]),          // Mực nước hiện tại
            hdbt: getText(cells[3]),         // Mực nước dâng bình thường
            hc: getText(cells[4]),           // Mực nước chết
            qve: getText(cells[5]),          // Lưu lượng đến
            totalQx: getText(cells[6]),      // Tổng lượng xả
            qxt: getText(cells[7]),          // Xả turbine
            qxm: getText(cells[8]),          // Xả mặt
            ncxs: getText(cells[9]),         // Số cửa xả sâu
            ncxm: getText(cells[10]),        // Số cửa xả mặt
          });
        });
      });

      return data;
    });

    await browser.close();

    // Parse và clean dữ liệu
    const cleanedData: ReservoirData[] = reservoirs
      .filter(r => r.name && r.name.length > 0)
      .map(r => ({
        name: r.name,
        htl: parseNumber(r.htl),
        hdbt: parseNumber(r.hdbt),
        hc: parseNumber(r.hc),
        qve: parseNumber(r.qve),
        totalQx: parseNumber(r.totalQx),
        qxt: parseNumber(r.qxt),
        qxm: parseNumber(r.qxm),
        ncxs: parseNumber(r.ncxs),
        ncxm: parseNumber(r.ncxm),
        updatedAt: new Date().toISOString()
      }));

    // Cập nhật cache
    cachedData = cleanedData;
    cacheTime = Date.now();

    // Sync to backend
    let syncResult = null;
    try {
      const backendData = cleanedData.map(r => ({
        name: r.name,
        htl: r.htl,
        hdbt: r.hdbt,
        hc: r.hc,
        qve: r.qve,
        total_qx: r.totalQx,  // Backend uses snake_case
        qxt: r.qxt,
        qxm: r.qxm,
        ncxs: r.ncxs,
        ncxm: r.ncxm,
      }));

      const syncResponse = await fetch('http://localhost:8000/api/evn-reservoirs/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(backendData)
      });

      if (syncResponse.ok) {
        syncResult = await syncResponse.json();
      }
    } catch (syncError) {
      console.error('Error syncing to backend:', syncError);
    }

    return NextResponse.json({
      data: cleanedData,
      cached: false,
      scrapedAt: new Date().toISOString(),
      count: cleanedData.length,
      source: 'https://hochuathuydien.evn.com.vn',
      syncResult
    });

  } catch (error) {
    console.error('Error scraping EVN data:', error);

    // Trả về cache cũ nếu có lỗi
    if (cachedData) {
      return NextResponse.json({
        data: cachedData,
        cached: true,
        cachedAt: cacheTime ? new Date(cacheTime).toISOString() : null,
        count: cachedData.length,
        error: 'Using cached data due to scraping error'
      });
    }

    return NextResponse.json({
      error: 'Failed to scrape EVN reservoir data',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST: Force refresh cache
export async function POST() {
  cachedData = null;
  cacheTime = null;
  return GET();
}
