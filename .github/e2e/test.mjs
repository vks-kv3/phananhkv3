// Kiểm thử đầu-cuối tạm thời: gửi 1 đơn THỬ NGHIỆM rồi tra cứu bằng mã
import { chromium } from 'playwright';
const BASE = 'http://localhost:4173/';
const note = (m) => console.log(`::notice::${m}`);
const fail = (m) => { console.log(`::error::${m}`); process.exitCode = 1; };

const browser = await chromium.launch();
const page = await browser.newPage();
const errors = [];
page.on('pageerror', e => errors.push(String(e)));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
page.on('response', async r => {
  const u = r.url();
  if (/firestore|identitytoolkit|securetoken|firebase/.test(u) && r.status() >= 300) {
    let body = ''; try { body = (await r.text()).slice(0, 300); } catch {}
    console.log(`::warning::HTTP ${r.status()} ${u.split('?')[0]} ${body}`);
  }
});
page.on('requestfailed', r => { if (/firestore|firebase/.test(r.url())) console.log(`::warning::FAILED ${r.url().split('?')[0]} ${r.failure()?.errorText}`); });
page.on('console', m => { if (/firestore|Firestore|offline|Firebase/i.test(m.text())) console.log(`::notice::console ${m.type()}: ${m.text().slice(0,400)}`); });
page.on('dialog', d => { errors.push('dialog: ' + d.message()); d.dismiss(); });

await page.goto(BASE + '#/');
await page.getByText('Tra cứu tiến độ đơn đã gửi').waitFor({ timeout: 15000 });
note('Trang chủ hiển thị OK, có nút Tra cứu');

await page.goto(BASE + '#/report');
await page.getByText('Nhóm dễ bị').first().click();
const sel = page.locator('select').first();
const opts = await sel.locator('option').allTextContents();
await sel.selectOption({ index: 1 });
await page.fill('input[placeholder="Họ và tên"]', '[THỬ NGHIỆM] Kiểm thử tự động');
await page.fill('input[placeholder="Năm sinh"]', '1990');
await page.fill('input[placeholder="SĐT liên hệ"]', '0900000000');
await page.fill('input[placeholder="Địa chỉ thường trú"]', 'Thử nghiệm');
await page.fill('input[placeholder="Tên cơ quan, tổ chức hoặc cá nhân"]', 'Thử nghiệm');
await page.fill('input[placeholder="Địa chỉ của đối tượng bị phản ánh"]', 'Thử nghiệm');
await page.fill('input[placeholder="Tiêu đề phản ánh"]', '[THỬ NGHIỆM] Kiểm tra mã tra cứu - xin bỏ qua');
await page.fill('textarea', 'Đơn kiểm thử tự động của chức năng mã tra cứu. Không phải phản ánh thật.');
await page.locator('button[type="submit"]').click();

try {
  await page.getByText('Tiếp nhận thành công').waitFor({ timeout: 90000 });
  note('Gửi đơn thành công');
} catch { fail('Không thấy màn hình gửi thành công. Lỗi: ' + errors.join(' | ').slice(0, 800)); }

const codeEl = page.locator('p.font-mono').first();
let code = null;
try { await codeEl.waitFor({ timeout: 5000 }); code = (await codeEl.textContent()).trim(); note('Mã tra cứu được cấp: ' + code); }
catch { fail('Không hiện mã tra cứu. Lỗi: ' + errors.join(' | ').slice(0, 800)); }

if (code) {
  await page.getByText('Tra cứu tiến độ').click();
  try {
    await page.getByText('Đơn đang được xem xét').waitFor({ timeout: 20000 });
    note('Tra cứu bằng mã OK: hiển thị tiến độ đơn');
  } catch { fail('Tra cứu không ra kết quả. Lỗi: ' + errors.join(' | ').slice(0, 800)); }

  await page.goto(BASE + '#/tra-cuu');
  await page.fill('input[placeholder="KV3-XXXX-XXXX"]', 'KV3-ZZZZ-ZZZZ');
  await page.getByRole('button', { name: 'Tra cứu' }).last().click();
  try { await page.getByText('Không tìm thấy đơn').waitFor({ timeout: 20000 }); note('Mã sai báo "Không tìm thấy" đúng'); }
  catch { fail('Mã sai không báo đúng. Lỗi: ' + errors.join(' | ').slice(0, 500)); }
}
if (errors.length) note('Lỗi console (tham khảo): ' + errors.join(' | ').slice(0, 900));
await browser.close();
