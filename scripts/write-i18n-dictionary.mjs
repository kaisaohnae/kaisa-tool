/**
 * Writes src/i18n/dictionary.ts with UTF-8 ko/zh/hi translations.
 * Run: node scripts/write-i18n-dictionary.mjs
 */
import {writeFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = join(__dirname, '..', 'src', 'i18n', 'dictionary.ts');

/** @type {Record<string, {ko: string, zh: string, hi: string}>} */
const d = {};

function add(en, ko, zh, hi) {
  if (d[en]) {
    console.warn('Duplicate key:', en);
  }
  d[en] = {ko, zh, hi};
}

// ——— Categories ———
add('Image', '이미지', '图片', 'छवि');
add('PDF', 'PDF', 'PDF', 'PDF');
add('FORMAT', 'FORMAT', 'FORMAT', 'FORMAT');
add('EDIT', 'EDIT', 'EDIT', 'EDIT');
add('UTIL', 'UTIL', 'UTIL', 'UTIL');
add('Resize, compress, convert, and edit images', '용량·리사이즈·변환·편집', '压缩、调整大小、转换与编辑图片', 'आकार बदलें, संपीड़ित करें, परिवर्तित करें और संपादित करें');
add('Compress, merge, split, and edit pages', '압축·합치기·분할·페이지 편집', '压缩、合并、拆分与编辑页面', 'संपीड़ित करें, मिलाएँ, विभाजित करें और पृष्ठ संपादित करें');
add('JSON, SQL, QR, encoding, and conversions', 'JSON·SQL·QR·인코딩·변환', 'JSON、SQL、二维码、编码与转换', 'JSON, SQL, QR, एन्कोडिंग और रूपांतरण');
add('Compare, sort, regex, and text tools', '비교·정렬·정규식·텍스트 가공', '对比、排序、正则与文本工具', 'तुलना, क्रमबद्धता, रेगेक्स और टेक्स्ट टूल');
add('Password, UUID, units, and helpers', '비밀번호·UUID·단위·유틸', '密码、UUID、单位与实用工具', 'पासवर्ड, UUID, इकाई और सहायक');

// ——— Image tool titles ———
add('Compress', '용량 줄이기', '压缩', 'संपीड़ित करें');
add('Resize', '사이즈 변경', '调整大小', 'आकार बदलें');
add('Crop', '자르기', '裁剪', 'क्रॉप');
add('Rotate & Flip', '회전·뒤집기', '旋转与翻转', 'घुमाएँ और पलटें');
add('Watermark', '워터마크', '水印', 'वॉटरमार्क');
add('Background', '배경', '背景', 'पृष्ठभूमि');
add('Favicon', 'Favicon', 'Favicon', 'Favicon');
add('JPG → PNG', 'JPG → PNG', 'JPG → PNG', 'JPG → PNG');
add('PNG → JPG', 'PNG → JPG', 'PNG → JPG', 'PNG → JPG');
add('WebP → JPG', 'WebP → JPG', 'WebP → JPG', 'WebP → JPG');

// ——— PDF tool titles ———
add('Compress PDF', 'PDF 압축', '压缩 PDF', 'PDF संपीड़ित करें');
add('Merge PDF', 'PDF 합치기', '合并 PDF', 'PDF मिलाएँ');
add('Split PDF', 'PDF 분할', '拆分 PDF', 'PDF विभाजित करें');
add('Rotate Pages', '페이지 회전', '旋转页面', 'पृष्ठ घुमाएँ');
add('Edit Pages', '페이지 편집', '编辑页面', 'पृष्ठ संपादित करें');
add('Stamp Image', '이미지 삽입', '插入图片', 'छवि स्टैम्प');
add('Metadata', '메타데이터', '元数据', 'मेटाडेटा');
add('JPG → PDF', 'JPG → PDF', 'JPG → PDF', 'JPG → PDF');
add('PDF → JPG', 'PDF → JPG', 'PDF → JPG', 'PDF → JPG');

// ——— Format tool titles ———
add('JSON', 'JSON', 'JSON', 'JSON');
add('SQL', 'SQL', 'SQL', 'SQL');
add('QR Code', 'QR 코드', '二维码', 'QR कोड');
add('Base64', 'Base64', 'Base64', 'Base64');
add('URL', 'URL', 'URL', 'URL');
add('Hash', '해시', '哈希', 'हैश');
add('CSV ↔ JSON', 'CSV ↔ JSON', 'CSV ↔ JSON', 'CSV ↔ JSON');
add('Markdown', 'Markdown', 'Markdown', 'Markdown');
add('Color', '색상', '颜色', 'रंग');
add('JWT', 'JWT', 'JWT', 'JWT');

// ——— Edit tool titles ———
add('Compare', '비교', '对比', 'तुलना');
add('Deduplicate', '중복 제거', '去重', 'डुप्लिकेट हटाएँ');
add('Sort Lines', '줄 정렬', '行排序', 'पंक्तियाँ क्रमबद्ध करें');
add('Case Convert', '대소문자', '大小写转换', 'केस बदलें');
add('Find & Replace', '찾기·바꾸기', '查找替换', 'खोजें और बदलें');
add('Word Count', '글자 수', '字数统计', 'शब्द गणना');
add('Slug', '슬러그', 'Slug', 'स्लग');
add('Regex', '정규식', '正则表达式', 'रेगेक्स');

// ——— Util tool titles ———
add('Password', '비밀번호', '密码', 'पासवर्ड');
add('UUID', 'UUID', 'UUID', 'UUID');
add('Timestamp', '타임스탬프', '时间戳', 'टाइमस्टैम्प');
add('Unit Converter', '단위 변환', '单位换算', 'इकाई परिवर्तक');

// ——— Tool descriptions (match tools.ts English) ———
add(
  'Reduce image file size by adjusting quality.',
  '품질을 조절해 이미지 파일 크기를 줄입니다.',
  '通过调整质量减小图片文件大小。',
  'गुणवत्ता समायोजित करके छवि फ़ाइल का आकार घटाएँ।'
);
add('Change width and height.', '가로·세로 크기를 변경합니다.', '更改宽度和高度。', 'चौड़ाई और ऊँचाई बदलें।');
add('Crop to a selected region.', '원하는 영역만 잘라냅니다.', '裁剪到所选区域。', 'चयनित क्षेत्र क्रॉप करें।');
add(
  'Rotate and flip horizontally or vertically.',
  '회전하고 좌우·상하로 뒤집습니다.',
  '旋转并水平或垂直翻转。',
  'घुमाएँ और क्षैतिज या ऊर्ध्वाधर पलटें।'
);
add(
  'Add a text or image watermark.',
  '텍스트·이미지 워터마크를 올립니다.',
  '添加文字或图片水印。',
  'टेक्स्ट या छवि वॉटरमार्क जोड़ें।'
);
add(
  'Fill or remove the background.',
  '배경색을 채우거나 투명하게 만듭니다.',
  '填充或去除背景。',
  'पृष्ठभूमि भरें या हटाएँ।'
);
add(
  'Generate favicon PNGs in multiple sizes.',
  '여러 크기의 파비콘 PNG를 만듭니다.',
  '生成多种尺寸的 Favicon PNG。',
  'कई आकारों में फ़ेविकॉन PNG बनाएँ।'
);
add('Convert JPG to PNG.', 'JPG를 PNG로 변환합니다.', '将 JPG 转换为 PNG。', 'JPG को PNG में बदलें।');
add('Convert PNG to JPG.', 'PNG를 JPG로 변환합니다.', '将 PNG 转换为 JPG。', 'PNG को JPG में बदलें।');
add('Convert WebP to JPG.', 'WebP를 JPG로 변환합니다.', '将 WebP 转换为 JPG。', 'WebP को JPG में बदलें।');
add(
  'Re-render pages to reduce PDF size.',
  '페이지를 다시 렌더링해 PDF 용량을 줄입니다.',
  '重新渲染页面以减小 PDF 体积。',
  'पेजों को फिर से रेंडर करके PDF आकार घटाएँ।'
);
add('Combine multiple PDFs into one.', '여러 PDF를 하나로 합칩니다.', '将多个 PDF 合并为一个。', 'कई PDF को एक में मिलाएँ।');
add('Split a PDF by pages.', '페이지 단위로 PDF를 나눕니다.', '按页拆分 PDF。', 'PDF को पृष्ठों में विभाजित करें।');
add('Rotate PDF pages.', 'PDF 페이지를 회전합니다.', '旋转 PDF 页面。', 'PDF पृष्ठ घुमाएँ।');
add('Reorder or delete pages.', '페이지 순서 변경·삭제를 합니다.', '调整页面顺序或删除页面。', 'पृष्ठ क्रम बदलें या हटाएँ।');
add('Stamp an image onto a PDF.', 'PDF에 이미지를 삽입합니다.', '将图片盖到 PDF 上。', 'PDF पर छवि स्टैम्प करें।');
add(
  'View and edit title, author, and other metadata.',
  '제목·작성자 등 메타정보를 보고 수정합니다.',
  '查看并编辑标题、作者等元数据。',
  'शीर्षक, लेखक और अन्य मेटाडेटा देखें और संपादित करें।'
);
add('Create a PDF from JPG images.', 'JPG 이미지를 PDF로 만듭니다.', '从 JPG 图片创建 PDF。', 'JPG छवियों से PDF बनाएँ।');
add(
  'Extract PDF pages as JPG images.',
  'PDF 페이지를 JPG로 추출합니다.',
  '将 PDF 页面导出为 JPG。',
  'PDF पृष्ठों को JPG के रूप में निकालें।'
);
add(
  'Format and validate JSON strings.',
  'JSON 문자열을 정렬하고 유효성을 검사합니다.',
  '格式化并校验 JSON 字符串。',
  'JSON स्ट्रिंग को फ़ॉर्मैट और सत्यापित करें।'
);
add(
  'Format SQL and configure style options.',
  'SQL 문을 정렬하고 패턴을 설정합니다.',
  '格式化 SQL 并配置样式选项。',
  'SQL फ़ॉर्मैट करें और शैली विकल्प सेट करें।'
);
add(
  'Generate a QR code from a URL or text.',
  'URL·텍스트로 QR 코드를 만듭니다.',
  '根据 URL 或文本生成二维码。',
  'URL या टेक्स्ट से QR कोड बनाएँ।'
);
add(
  'Encode and decode text as Base64.',
  '텍스트를 Base64로 인코딩·디코딩합니다.',
  '将文本编码或解码为 Base64。',
  'टेक्स्ट को Base64 में एन्कोड/डिकोड करें।'
);
add('Encode and decode URLs.', 'URL을 인코딩·디코딩합니다.', '编码或解码 URL。', 'URL एन्कोड और डिकोड करें।');
add('Compute MD5 and SHA hashes.', 'MD5·SHA 해시를 계산합니다.', '计算 MD5 与 SHA 哈希。', 'MD5 और SHA हैश गणना करें।');
add(
  'Convert between CSV and JSON.',
  'CSV와 JSON을 서로 변환합니다.',
  '在 CSV 与 JSON 之间转换。',
  'CSV और JSON के बीच रूपांतरण करें।'
);
add('Preview Markdown as HTML.', '마크다운을 HTML로 미리봅니다.', '将 Markdown 预览为 HTML。', 'Markdown को HTML के रूप में देखें।');
add(
  'Convert between HEX, RGB, and HSL.',
  'HEX·RGB·HSL을 변환합니다.',
  '在 HEX、RGB、HSL 之间转换。',
  'HEX, RGB और HSL के बीच रूपांतरण करें।'
);
add(
  'Decode JWT header and payload.',
  'JWT 헤더·페이로드를 디코드합니다.',
  '解码 JWT 头部与载荷。',
  'JWT हेडर और पेलोड डिकोड करें।'
);
add(
  'Compare two texts line by line.',
  '두 텍스트의 줄 단위 차이를 비교합니다.',
  '逐行对比两段文本。',
  'दो टेक्स्ट की पंक्ति-दर-पंक्ति तुलना करें।'
);
add('Remove duplicate lines.', '중복된 줄을 제거합니다.', '去除重复行。', 'डुप्लिकेट पंक्तियाँ हटाएँ।');
add('Sort and clean up lines.', '줄을 정렬하고 정리합니다.', '排序并整理行。', 'पंक्तियाँ क्रमबद्ध और साफ़ करें।');
add(
  'Change letter case and case styles.',
  '대소문자·케이스 스타일을 바꿉니다.',
  '更改字母大小写与样式。',
  'अक्षर केस और शैली बदलें।'
);
add(
  'Find and replace with text or regex.',
  '문자열·정규식으로 찾아 바꿉니다.',
  '用文本或正则查找并替换。',
  'टेक्स्ट या रेगेक्स से खोजकर बदलें।'
);
add(
  'Count characters, words, lines, and bytes.',
  '글자·단어·줄·바이트를 셉니다.',
  '统计字符、单词、行与字节。',
  'अक्षर, शब्द, पंक्तियाँ और बाइट गिनें।'
);
add('Generate a URL-friendly slug.', 'URL용 슬러그를 만듭니다.', '生成适合 URL 的 slug。', 'URL-अनुकूल स्लग बनाएँ।');
add(
  'Test regular expressions and inspect matches.',
  '정규식을 테스트하고 매치를 확인합니다.',
  '测试正则表达式并查看匹配。',
  'रेगुलर एक्सप्रेशन टेस्ट करें और मैच देखें।'
);
add('Generate a secure password.', '안전한 비밀번호를 생성합니다.', '生成安全密码。', 'सुरक्षित पासवर्ड बनाएँ।');
add('Generate UUIDs.', 'UUID를 생성합니다.', '生成 UUID。', 'UUID बनाएँ।');
add(
  'Convert between Unix time and dates.',
  '유닉스 시간과 날짜를 변환합니다.',
  '在 Unix 时间与日期之间转换。',
  'Unix समय और तिथियों के बीच रूपांतरण करें।'
);
add(
  'Convert length, size, temperature, and px/rem.',
  '길이·용량·온도·px/rem을 변환합니다.',
  '换算长度、容量、温度与 px/rem。',
  'लंबाई, आकार, तापमान और px/rem बदलें।'
);

// Longer shell descriptions used in some tools
add(
  'Lower quality and re-save as JPEG. Transparent backgrounds become white. Files stay in your browser.',
  '품질을 낮춰 JPEG로 다시 저장합니다. 투명 배경은 흰색으로 처리되며, 파일은 브라우저에서만 처리됩니다.',
  '降低质量并重新保存为 JPEG。透明背景会变为白色。文件仅在浏览器中处理。',
  'गुणवत्ता घटाकर JPEG के रूप में सहेजें। पारदर्शी पृष्ठभूमि सफ़ेद हो जाती है। फ़ाइलें ब्राउज़र में ही रहती हैं।'
);
add(
  'Change width and height in pixels. Supports up to 8192px.',
  '가로·세로 픽셀 크기를 변경합니다. 최대 8192px까지 지원합니다.',
  '按像素更改宽度和高度。最高支持 8192px。',
  'पिक्सल में चौड़ाई और ऊँचाई बदलें। अधिकतम 8192px तक।'
);
add(
  'Drag to select a region or enter coordinates to crop the image.',
  '드래그로 영역을 선택하거나 좌표를 입력해 이미지를 자릅니다.',
  '拖动选择区域或输入坐标以裁剪图片。',
  'खींचकर क्षेत्र चुनें या निर्देशांक दर्ज करके छवि क्रॉप करें।'
);
add(
  'Place a text or image watermark on top of the original.',
  '텍스트 또는 이미지 워터마크를 원본 위에 올립니다.',
  '在原图上叠加文字或图片水印。',
  'मूल छवि पर टेक्स्ट या छवि वॉटरमार्क लगाएँ।'
);
add(
  'Flatten a transparent PNG onto a solid color, or make similar colors transparent to remove the background.',
  '투명 PNG를 단색 위에 올리거나, 비슷한 색을 투명하게 만들어 배경을 제거합니다.',
  '将透明 PNG 铺到纯色上，或把相近颜色变为透明以去除背景。',
  'पारदर्शी PNG को ठोस रंग पर रखें, या मिलते-जुलते रंगों को पारदर्शी बनाकर पृष्ठभूमि हटाएँ।'
);
add(
  'Fit the image to a square and export favicon PNGs as a ZIP.',
  '이미지를 정사각으로 맞춰 파비콘 PNG ZIP을 만듭니다.',
  '将图片裁为正方形并导出 Favicon PNG ZIP。',
  'छवि को वर्ग में फिट करके फ़ेविकॉन PNG ZIP निर्यात करें।'
);
add(
  'Re-pack each page as an image to shrink the file. Text selection and vectors may not be preserved.',
  '각 페이지를 이미지로 다시 담아 용량을 줄입니다. 텍스트 선택·벡터는 유지되지 않을 수 있습니다.',
  '将每页重新存为图像以缩小文件。文本选择与矢量可能无法保留。',
  'प्रत्येक पृष्ठ को छवि के रूप में फिर पैक करके फ़ाइल घटाएँ। टेक्स्ट चयन और वेक्टर संरक्षित नहीं रह सकते।'
);
add(
  'Merge several PDF files into a single document.',
  '여러 PDF 파일을 하나의 문서로 합칩니다.',
  '将多个 PDF 合并为单个文档。',
  'कई PDF फ़ाइलों को एक दस्तावेज़ में मिलाएँ।'
);
add(
  'Split a PDF into separate files by page ranges.',
  '페이지 범위로 PDF를 여러 파일로 나눕니다.',
  '按页范围将 PDF 拆成多个文件。',
  'पृष्ठ श्रेणियों के अनुसार PDF को अलग फ़ाइलों में बाँटें।'
);
add(
  'Rotate all pages or selected pages in 90° steps.',
  'PDF 전체 또는 선택한 페이지를 90° 단위로 회전합니다.',
  '按 90° 步进旋转全部或所选页面。',
  'सभी या चयनित पृष्ठों को 90° चरणों में घुमाएँ।'
);
add(
  'Reorder pages with thumbnails, mark pages to delete, then export a new PDF.',
  '썸네일로 페이지 순서를 바꾸고, 삭제할 페이지를 선택한 뒤 새 PDF로 내보냅니다.',
  '用缩略图调整顺序、标记要删除的页面，然后导出新 PDF。',
  'थंबनेल से क्रम बदलें, हटाने वाले पृष्ठ चुनें, फिर नया PDF निर्यात करें।'
);
add(
  'Place a logo or stamp image on PDF pages.',
  'PDF 페이지에 로고·스탬프 이미지를 올립니다.',
  '在 PDF 页面上放置徽标或印章图片。',
  'PDF पृष्ठों पर लोगो या स्टैम्प छवि लगाएँ।'
);
add(
  'Review and edit document properties such as title and author, then save a new file.',
  'PDF 제목·작성자 등 문서 속성을 확인하고 수정한 뒤 새 파일로 저장합니다.',
  '查看并编辑标题、作者等文档属性，然后另存为新文件。',
  'शीर्षक व लेखक जैसी दस्तावेज़ गुण देखें-संपादित करें, फिर नई फ़ाइल सहेजें।'
);
add(
  'Build a PDF from one or more JPG images.',
  '하나 이상의 JPG 이미지로 PDF를 만듭니다.',
  '用一张或多张 JPG 图片生成 PDF。',
  'एक या अधिक JPG छवियों से PDF बनाएँ।'
);
add(
  'Extract each page as JPG and download a ZIP.',
  '각 페이지를 JPG로 추출해 ZIP으로 받습니다.',
  '将每页导出为 JPG 并下载 ZIP。',
  'प्रत्येक पृष्ठ को JPG के रूप में निकालकर ZIP डाउनलोड करें।'
);
add(
  'Paste a string to validate or format JSON with your preferred style.',
  '문자열을 붙여 넣고 유효성을 검사하거나, 정렬 패턴에 맞게 포맷합니다.',
  '粘贴字符串以校验或按偏好样式格式化 JSON。',
  'स्ट्रिंग चिपकाकर JSON सत्यापित या अपनी शैली में फ़ॉर्मैट करें।'
);
add(
  'Format SQL statements and tweak indentation and keyword case.',
  'SQL 문을 포맷하고 들여쓰기·키워드 케이스를 조정합니다.',
  '格式化 SQL，并调整缩进与关键字大小写。',
  'SQL कथन फ़ॉर्मैट करें और इंडेंट/कीवर्ड केस समायोजित करें।'
);
add(
  'Create a QR code from a URL or any text.',
  'URL이나 텍스트로 QR 코드를 생성합니다.',
  '根据 URL 或任意文本创建二维码。',
  'URL या किसी भी टेक्स्ट से QR कोड बनाएँ।'
);
add(
  'Encode or decode text with Base64. Processing stays in the browser.',
  '텍스트를 Base64로 인코딩하거나 디코딩합니다. 처리는 브라우저에서만 이루어집니다.',
  '用 Base64 编码或解码文本。处理仅在浏览器中进行。',
  'Base64 से टेक्स्ट एन्कोड/डिकोड करें। प्रोसेसिंग ब्राउज़र में ही रहती है।'
);
add(
  'Percent-encode or decode a URL or query value (encodeURIComponent / encodeURI).',
  'URL 또는 쿼리 값을 퍼센트 인코딩/디코딩합니다. (encodeURIComponent / encodeURI)',
  '对 URL 或查询值进行百分号编码/解码（encodeURIComponent / encodeURI）。',
  'URL या क्वेरी मान को प्रतिशत एन्कोड/डिकोड करें (encodeURIComponent / encodeURI)।'
);
add(
  'Compute MD5 / SHA hashes for text or a file. All work stays in the browser.',
  '텍스트 또는 파일의 MD5 / SHA 해시를 계산합니다. 모든 처리는 브라우저에서만 수행됩니다.',
  '计算文本或文件的 MD5 / SHA 哈希。全部在浏览器中完成。',
  'टेक्स्ट या फ़ाइल का MD5 / SHA हैश गणना करें। सब कुछ ब्राउज़र में ही होता है।'
);
add(
  'Convert CSV to JSON or JSON to CSV.',
  'CSV를 JSON으로, 또는 JSON을 CSV로 변환합니다.',
  '在 CSV 与 JSON 之间互相转换。',
  'CSV को JSON या JSON को CSV में बदलें।'
);
add(
  'Live-preview Markdown rendered as HTML.',
  '마크다운을 HTML로 실시간 미리봅니다.',
  '将 Markdown 实时预览为 HTML。',
  'Markdown का HTML लाइव प्रीव्यू देखें।'
);
add(
  'Convert colors between HEX, RGB, and HSL.',
  'HEX·RGB·HSL 색상을 서로 변환합니다.',
  '在 HEX、RGB、HSL 之间转换颜色。',
  'HEX, RGB और HSL रंगों के बीच रूपांतरण करें।'
);
add(
  'Decode a JWT and inspect its header and payload (no signature verification).',
  'JWT를 디코드해 헤더와 페이로드를 확인합니다. (서명 검증 없음)',
  '解码 JWT 并查看头部与载荷（不验证签名）。',
  'JWT डिकोड कर हेडर व पेलोड देखें (हस्ताक्षर सत्यापन नहीं)।'
);
add(
  'Diff two texts line by line.',
  '두 텍스트의 줄 단위 차이를 비교합니다.',
  '逐行对比两段文本的差异。',
  'दो टेक्स्ट की पंक्ति-दर-पंक्ति भिन्नता देखें।'
);
add(
  'Remove duplicate lines from text.',
  '텍스트에서 중복된 줄을 제거합니다.',
  '从文本中去除重复行。',
  'टेक्स्ट से डुप्लिकेट पंक्तियाँ हटाएँ।'
);
add(
  'Sort lines and clean duplicates or blank lines.',
  '줄을 기준에 맞게 정렬하고, 중복·빈 줄을 정리합니다.',
  '按规则排序行，并清理重复或空行。',
  'पंक्तियाँ क्रमबद्ध करें और डुप्लिकेट/खाली पंक्तियाँ साफ़ करें।'
);
add(
  'Switch between uppercase, lowercase, title case, and more.',
  '대문자·소문자·타이틀 케이스 등으로 바꿉니다.',
  '在大写、小写、标题格式等之间切换。',
  'अपरकेस, लोअरकेस, टाइटल केस आदि में बदलें।'
);
add(
  'Find and replace using plain text or regular expressions.',
  '일반 텍스트 또는 정규식으로 찾아 바꿉니다.',
  '用纯文本或正则表达式查找并替换。',
  'सादा टेक्स्ट या रेगेक्स से खोजकर बदलें।'
);
add(
  'See character, word, line, and byte counts as you type.',
  '입력하는 동안 문자·단어·줄·바이트 수를 바로 보여 줍니다.',
  '输入时即时显示字符、单词、行与字节数。',
  'टाइप करते ही अक्षर, शब्द, पंक्ति और बाइट गिनती देखें।'
);
add(
  'Build a URL slug. Choose how non-Latin characters are kept, removed, or romanized.',
  'URL용 슬러그를 만듭니다. 비라틴 문자는 유지·제거·로마자 변환을 선택할 수 있습니다.',
  '生成 URL slug。可选择保留、删除或罗马化非拉丁字符。',
  'URL स्लग बनाएँ। गैर-लैटिन अक्षर रखने, हटाने या रोमनाइज़ करने का विकल्प चुनें।'
);
add(
  'Test a pattern and inspect matches, groups, and replace preview.',
  '패턴을 테스트하고 매치·그룹·바꾸기 미리보기를 확인합니다.',
  '测试模式并查看匹配、分组与替换预览。',
  'पैटर्न टेस्ट करें और मैच, समूह व रिप्लेस प्रीव्यू देखें।'
);
add(
  'Create a strong password with browser randomness. Nothing is sent to a server.',
  '브라우저의 난수로 안전한 비밀번호를 만듭니다. 서버로 전송되지 않습니다.',
  '用浏览器随机数生成强密码。不会发送到服务器。',
  'ब्राउज़र रैंडमनेस से मजबूत पासवर्ड बनाएँ। सर्वर पर कुछ नहीं भेजा जाता।'
);
add(
  'Generate one or more UUIDs.',
  '하나 이상의 UUID를 생성합니다.',
  '生成一个或多个 UUID。',
  'एक या अधिक UUID बनाएँ।'
);
add(
  'Convert between Unix time (seconds/milliseconds) and ISO dates.',
  'Unix 시간(초/밀리초)과 ISO 날짜를 서로 변환합니다.',
  '在 Unix 时间（秒/毫秒）与 ISO 日期之间转换。',
  'Unix समय (सेकंड/मिलीसेकंड) और ISO तिथियों के बीच रूपांतरण करें।'
);
add(
  'Convert length, file size, temperature, and px/rem.',
  '길이·용량·온도·px/rem을 변환합니다.',
  '换算长度、文件大小、温度与 px/rem。',
  'लंबाई, फ़ाइल आकार, तापमान और px/rem बदलें।'
);

// ——— Common UI ———
add('Drop files here or click', '파일을 끌어다 놓거나 클릭', '将文件拖到此处或点击', 'फ़ाइलें यहाँ छोड़ें या क्लिक करें');
add('Drag and drop or click to choose files', '드래그 앤 드롭하거나 클릭하여 파일을 선택하세요', '拖放或点击选择文件', 'खींचकर छोड़ें या क्लिक करके फ़ाइलें चुनें');
add('Unsupported files were skipped.', '지원하지 않는 파일을 제외했습니다.', '已跳过不支持的文件。', 'असमर्थित फ़ाइलें छोड़ दी गईं।');
add('Remove', '제거', '移除', 'हटाएँ');
add('Download', '다운로드', '下载', 'डाउनलोड');
add('Clear', '지우기', '清除', 'साफ़ करें');
add('Copy', '복사', '复制', 'कॉपी');
add('Copied to clipboard.', '클립보드에 복사했습니다.', '已复制到剪贴板。', 'क्लिपबोर्ड पर कॉपी हो गया।');
add('Copy failed.', '복사에 실패했습니다.', '复制失败。', 'कॉपी विफल।');
add('Processing…', '처리 중…', '处理中…', 'प्रोसेस हो रहा है…');
add('Convert', '변환', '转换', 'परिवर्तित करें');
add('Run', '실행', '运行', 'चलाएँ');
add('Apply', '적용', '应用', 'लागू करें');
add('Generate', '생성', '生成', 'बनाएँ');
add('Encode', '인코딩', '编码', 'एन्कोड');
add('Decode', '디코딩', '解码', 'डिकोड');
add('Format', '포맷', '格式化', 'फ़ॉर्मैट');
add('Minify', '압축', '压缩', 'मिनिफ़ाय');
add('Validate', '유효성 검사', '校验', 'सत्यापित करें');
add('Close menu', '메뉴 접기', '关闭菜单', 'मेनू बंद करें');
add('Open menu', '메뉴 펼치기', '打开菜单', 'मेनू खोलें');
add('Switch to light mode', '라이트 모드로 전환', '切换到浅色模式', 'लाइट मोड पर स्विच करें');
add('Switch to dark mode', '다크 모드로 전환', '切换到深色模式', 'डार्क मोड पर स्विच करें');
add('Main navigation', '주 탐색', '主导航', 'मुख्य नेविगेशन');
add('Mobile navigation', '모바일 탐색', '移动导航', 'मोबाइल नेविगेशन');
add('No content to copy.', '복사할 내용이 없습니다.', '没有可复制的内容。', 'कॉपी करने के लिए कुछ नहीं।');
add('Enter text.', '내용을 입력하세요.', '请输入文本。', 'टेक्स्ट दर्ज करें।');
add('Failed.', '실패했습니다.', '失败。', 'विफल।');
add('Success.', '성공했습니다.', '成功。', 'सफल।');

// Field labels
add('Quality', '품질', '质量', 'गुणवत्ता');
add('Width', '너비', '宽度', 'चौड़ाई');
add('Height', '높이', '高度', 'ऊँचाई');
add('Size', '크기', '大小', 'आकार');
add('Opacity', '투명도', '不透明度', 'अपारदर्शिता');
add('Position', '위치', '位置', 'स्थिति');
add('Angle', '각도', '角度', 'कोण');
add('Tolerance', '허용 오차', '容差', 'सहनशीलता');
add('Page', '페이지', '页', 'पृष्ठ');
add('All pages', '모든 페이지', '全部页面', 'सभी पृष्ठ');
add('Rotate 90°', '90° 회전', '旋转 90°', '90° घुमाएँ');
add('Rotate 180°', '180° 회전', '旋转 180°', '180° घुमाएँ');
add('Rotate 270°', '270° 회전', '旋转 270°', '270° घुमाएँ');
add('Flip horizontal', '좌우 뒤집기', '水平翻转', 'क्षैतिज पलटें');
add('Flip vertical', '상하 뒤집기', '垂直翻转', 'ऊर्ध्वाधर पलटें');
add('Characters', '문자', '字符', 'अक्षर');
add('Words', '단어', '单词', 'शब्द');
add('Lines', '줄', '行', 'पंक्तियाँ');
add('Bytes', '바이트', '字节', 'बाइट');
add('Sentences', '문장', '句子', 'वाक्य');
add('Uppercase', '대문자', '大写', 'अपरकेस');
add('Lowercase', '소문자', '小写', 'लोअरकेस');
add('Title Case', '타이틀 케이스', '标题格式', 'टाइटल केस');
add('Sentence case', '문장 케이스', '句首大写', 'सेंटेंस केस');
add('camelCase', 'camelCase', 'camelCase', 'camelCase');
add('PascalCase', 'PascalCase', 'PascalCase', 'PascalCase');
add('snake_case', 'snake_case', 'snake_case', 'snake_case');
add('kebab-case', 'kebab-case', 'kebab-case', 'kebab-case');
add('CONSTANT_CASE', 'CONSTANT_CASE', 'CONSTANT_CASE', 'CONSTANT_CASE');
add('Error correction', '오류 정정', '纠错级别', 'त्रुटि सुधार');
add('Margin', '여백', '边距', 'मार्जिन');
add('Foreground', '전경', '前景', 'अग्रभूमि');
add('Background color', '배경색', '背景色', 'पृष्ठभूमि रंग');
add('Content', '내용', '内容', 'सामग्री');
add('PNG Download', 'PNG 다운로드', '下载 PNG', 'PNG डाउनलोड');
add('Preview appears when you enter text.', '텍스트를 입력하면 미리보기가 나타납니다.', '输入文本后显示预览。', 'टेक्स्ट दर्ज करने पर प्रीव्यू दिखता है।');
add('Strength', '강도', '强度', 'मज़बूती');
add('Length', '길이', '长度', 'लंबाई');
add('Include uppercase', '대문자 포함', '包含大写字母', 'अपरकेस शामिल करें');
add('Include lowercase', '소문자 포함', '包含小写字母', 'लोअरकेस शामिल करें');
add('Include digits', '숫자 포함', '包含数字', 'अंक शामिल करें');
add('Include symbols', '기호 포함', '包含符号', 'प्रतीक शामिल करें');
add('Exclude similar characters', '비슷한 문자 제외', '排除易混淆字符', 'मिलते-जुलते अक्षर छोड़ें');
add('Local time', '로컬 시간', '本地时间', 'स्थानीय समय');
add('Unix seconds', 'Unix 초', 'Unix 秒', 'Unix सेकंड');
add('Unix milliseconds', 'Unix 밀리초', 'Unix 毫秒', 'Unix मिलीसेकंड');
add('px / rem base', 'px / rem 기준', 'px / rem 基准', 'px / rem आधार');
add('Temperature', '온도', '温度', 'तापमान');
add('Mode', '모드', '模式', 'मोड');
add('Output format', '저장 형식', '输出格式', 'आउटपुट फ़ॉर्मैट');
add('Keep aspect ratio', '비율 유지', '保持宽高比', 'अनुपात बनाए रखें');
add('Original', '원본', '原图', 'मूल');
add('Result preview', '결과 미리보기', '结果预览', 'परिणाम प्रीव्यू');
add('Top left', '왼쪽 위', '左上', 'ऊपर बाएँ');
add('Top right', '오른쪽 위', '右上', 'ऊपर दाएँ');
add('Center', '가운데', '居中', 'केंद्र');
add('Bottom left', '왼쪽 아래', '左下', 'नीचे बाएँ');
add('Bottom right', '오른쪽 아래', '右下', 'नीचे दाएँ');
add('Custom (%)', '사용자 지정 (%)', '自定义 (%)', 'कस्टम (%)');
add('Page number', '페이지 번호', '页码', 'पृष्ठ संख्या');
add('Specific page', '특정 페이지', '指定页面', 'विशिष्ट पृष्ठ');
add('Selected pages only', '선택한 페이지만', '仅所选页面', 'केवल चयनित पृष्ठ');
add('Rotation angle', '회전 각도', '旋转角度', 'घुमाव कोण');
add('Apply to', '적용 범위', '应用于', 'लागू करें');
add('Page numbers (comma-separated)', '페이지 번호 (쉼표 구분)', '页码（逗号分隔）', 'पृष्ठ संख्या (अल्पविराम से अलग)');
add('e.g. 1, 2, 5', '예: 1, 2, 5', '例如：1, 2, 5', 'उदा. 1, 2, 5');
add('Title', '제목', '标题', 'शीर्षक');
add('Author', '작성자', '作者', 'लेखक');
add('Subject', '주제', '主题', 'विषय');
add('Keywords (comma-separated)', '키워드 (쉼표 구분)', '关键词（逗号分隔）', 'कीवर्ड (अल्पविराम से अलग)');
add('Creator app', '생성 앱', '创建应用', 'निर्माता ऐप');
add('Producer', 'Producer', 'Producer', 'Producer');
add('Created', '생성일', '创建时间', 'निर्माण तिथि');
add('Modified', '수정일', '修改时间', 'संशोधन तिथि');
add('PDF file', 'PDF 파일', 'PDF 文件', 'PDF फ़ाइल');
add('Image to stamp', '삽입할 이미지', '要插入的图片', 'स्टैम्प करने की छवि');
add('1 PDF', 'PDF 1개', '1 个 PDF', '1 PDF');
add('JPG, PNG, WebP', 'JPG, PNG, WebP', 'JPG、PNG、WebP', 'JPG, PNG, WebP');
add('Delete', '삭제', '删除', 'हटाएँ');
add('Restore', '복원', '恢复', 'पुनर्स्थापित करें');
add('Export PDF', 'PDF 내보내기', '导出 PDF', 'PDF निर्यात');
add('Exporting…', '내보내는 중…', '正在导出…', 'निर्यात हो रहा है…');
add('Saving…', '저장 중…', '正在保存…', 'सहेजा जा रहा है…');
add('Save metadata', '메타데이터 저장', '保存元数据', 'मेटाडेटा सहेजें');
add('Stamping…', '삽입 중…', '正在插入…', 'स्टैम्प हो रहा है…');
add('Rotating…', '회전 중…', '正在旋转…', 'घुमाया जा रहा है…');
add('Apply rotation', '회전 적용', '应用旋转', 'घुमाव लागू करें');
add('Compressing…', '압축 중…', '正在压缩…', 'संपीड़ित हो रहा है…');
add('Converting…', '변환 중…', '正在转换…', 'परिवर्तन हो रहा है…');
add('Convert to JPG', 'JPG로 변환', '转换为 JPG', 'JPG में बदलें');
add('Generating…', '생성 중…', '正在生成…', 'बनाया जा रहा है…');
add('Generate favicon', 'Favicon 생성', '生成 Favicon', 'फ़ेविकॉन बनाएँ');
add('Cropping…', '자르는 중…', '正在裁剪…', 'क्रॉप हो रहा है…');
add('Applying…', '적용 중…', '正在应用…', 'लागू हो रहा है…');
add('Apply watermark', '워터마크 적용', '应用水印', 'वॉटरमार्क लागू करें');
add('Loading…', '불러오는 중…', '加载中…', 'लोड हो रहा है…');
add('Preparing…', '준비 중…', '准备中…', 'तैयार हो रहा है…');
add('Preparing preview…', '미리보기 준비 중…', '正在准备预览…', 'प्रीव्यू तैयार हो रहा है…');
add('Reading metadata…', '메타데이터 읽는 중…', '正在读取元数据…', 'मेटाडेटा पढ़ा जा रहा है…');
add('Square fit', '정사각 맞춤', '正方形适配', 'वर्ग फिट');
add('Cover (crop to fill)', '가운데 잘라 채우기 (cover)', '裁剪填充 (cover)', 'कवर (भरने के लिए क्रॉप)');
add('Contain (fit inside)', '비율 유지 맞춤 (contain)', '等比适配 (contain)', 'कंटेन (अंदर फिट)');
add('Flatten onto solid color', '단색 배경으로 합치기', '铺到纯色背景', 'ठोस रंग पर समतल करें');
add('Similar color → transparent', '비슷한 색 → 투명', '相近颜色 → 透明', 'मिलता रंग → पारदर्शी');
add('32×32 preview', '32×32 미리보기', '32×32 预览', '32×32 प्रीव्यू');
add('Download ZIP', 'ZIP 다운로드', '下载 ZIP', 'ZIP डाउनलोड');
add('Download 32×32 PNG', '32×32 PNG 다운로드', '下载 32×32 PNG', '32×32 PNG डाउनलोड');
add('Original image', '원본 이미지', '原图', 'मूल छवि');
add('Image watermark (optional)', '이미지 워터마크 (선택)', '图片水印（可选）', 'छवि वॉटरमार्क (वैकल्पिक)');
add('Logo PNG, etc.', '로고 PNG 등', '徽标 PNG 等', 'लोगो PNG आदि');
add('Watermark text', '워터마크 문구', '水印文字', 'वॉटरमार्क टेक्स्ट');

// Status / messages
add('Valid JSON.', '유효한 JSON입니다.', '有效的 JSON。', 'वैध JSON।');
add('Formatted.', '정렬했습니다.', '已格式化。', 'फ़ॉर्मैट हो गया।');
add('Formatted with sorted keys.', '키 정렬 후 포맷했습니다.', '已按键排序并格式化。', 'सॉर्टेड कुंजियों के साथ फ़ॉर्मैट।');
add('Minified.', '한 줄로 압축했습니다.', '已压缩为一行。', 'मिनिफ़ाय हो गया।');
add('Invalid input.', '잘못된 입력입니다.', '输入无效。', 'अमान्य इनपुट।');
add('Invalid JSON.', '유효하지 않은 JSON입니다.', '无效的 JSON。', 'अमान्य JSON।');
add('Processing failed.', '처리에 실패했습니다.', '处理失败。', 'प्रोसेसिंग विफल।');
add('Conversion failed.', '변환에 실패했습니다.', '转换失败。', 'रूपांतरण विफल।');
add('Did not get smaller than the original. Try a lower quality.', '원본보다 작아지지 않았습니다. 품질을 더 낮춰 보세요.', '未能小于原文件。请尝试更低质量。', 'मूल से छोटा नहीं हुआ। कम गुणवत्ता आज़माएँ।');
add('Could not read image info.', '이미지 정보를 읽지 못했습니다.', '无法读取图片信息。', 'छवि जानकारी नहीं पढ़ सके।');
add('Could not read image.', '이미지를 읽지 못했습니다.', '无法读取图片。', 'छवि नहीं पढ़ सके।');
add('Crop failed.', '자르기에 실패했습니다.', '裁剪失败。', 'क्रॉप विफल।');
add('Watermark failed.', '워터마크 적용에 실패했습니다.', '水印应用失败。', 'वॉटरमार्क विफल।');
add('Favicon generation failed.', 'Favicon 생성에 실패했습니다.', 'Favicon 生成失败。', 'फ़ेविकॉन बनाना विफल।');
add('Could not create preview.', '미리보기를 만들지 못했습니다.', '无法创建预览。', 'प्रीव्यू नहीं बना सके।');
add('No pages to export.', '내보낼 페이지가 없습니다.', '没有可导出的页面。', 'निर्यात के लिए कोई पृष्ठ नहीं।');
add('Export failed.', '내보내기에 실패했습니다.', '导出失败。', 'निर्यात विफल।');
add('Could not read metadata.', '메타데이터를 읽지 못했습니다.', '无法读取元数据。', 'मेटाडेटा नहीं पढ़ सके।');
add('Save failed.', '저장에 실패했습니다.', '保存失败。', 'सहेजना विफल।');
add('Stamp failed.', '이미지 삽입에 실패했습니다.', '插入图片失败。', 'स्टैम्प विफल।');
add('Rotation failed.', '회전에 실패했습니다.', '旋转失败。', 'घुमाना विफल।');
add('Enter page numbers. e.g. 1,3,5', '페이지 번호를 입력하세요. 예: 1,3,5', '请输入页码，例如：1,3,5', 'पृष्ठ संख्या दर्ज करें। उदा. 1,3,5');
add('Hash calculation failed.', '해시 계산에 실패했습니다.', '哈希计算失败。', 'हैश गणना विफल।');
add('File hash calculation failed.', '파일 해시 계산에 실패했습니다.', '文件哈希计算失败。', 'फ़ाइल हैश गणना विफल।');
add('No hash to copy.', '복사할 해시가 없습니다.', '没有可复制的哈希。', 'कॉपी करने के लिए हैश नहीं।');
add('Hash copied.', '해시를 복사했습니다.', '已复制哈希。', 'हैश कॉपी हो गया।');
add('Matches expected hash.', '예상 해시와 일치합니다.', '与预期哈希一致。', 'अपेक्षित हैश से मेल खाता है।');
add('Does not match expected hash.', '예상 해시와 일치하지 않습니다.', '与预期哈希不一致。', 'अपेक्षित हैश से मेल नहीं खाता।');
add('Applied result to the input.', '결과를 입력란에 반영했습니다.', '已将结果应用到输入框。', 'परिणाम इनपुट पर लागू किया।');
add('Converted.', '변환했습니다.', '已转换。', 'परिवर्तित।');
add('Inserted current time.', '현재 시각을 넣었습니다.', '已填入当前时间。', 'वर्तमान समय डाला।');
add('Encoded full URL.', 'URL 전체를 인코딩했습니다.', '已编码完整 URL。', 'पूरा URL एन्कोड किया।');
add('Encoded component.', '컴포넌트를 인코딩했습니다.', '已编码组件。', 'कंपोनेंट एन्कोड किया।');
add('Decoded.', '디코딩했습니다.', '已解码。', 'डिकोड किया।');
add('Replace preview copied.', '바꾸기 미리보기를 복사했습니다.', '已复制替换预览。', 'रिप्लेस प्रीव्यू कॉपी हो गया।');
add('Encoded.', '인코딩했습니다.', '已编码。', 'एन्कोड किया।');
add('SQL formatted.', 'SQL을 포맷했습니다.', '已格式化 SQL。', 'SQL फ़ॉर्मैट हो गया।');
add('Merged.', '합쳤습니다.', '已合并。', 'मिला दिया।');
add('Split complete.', '분할했습니다.', '已拆分。', 'विभाजन पूर्ण।');
add('Done.', '완료했습니다.', '完成。', 'हो गया।');
add('Ready.', '준비됨.', '就绪。', 'तैयार।');
add('Please select a file.', '파일을 선택하세요.', '请选择文件。', 'कृपया एक फ़ाइल चुनें।');
add('Please select files.', '파일을 선택하세요.', '请选择文件。', 'कृपया फ़ाइलें चुनें।');
add('Nothing to download.', '다운로드할 내용이 없습니다.', '没有可下载的内容。', 'डाउनलोड करने के लिए कुछ नहीं।');
add('Text to hash', '해시할 텍스트', '要哈希的文本', 'हैश करने का टेक्स्ट');
add('Result appears here', '결과가 여기에 표시됩니다', '结果将显示在这里', 'परिणाम यहाँ दिखेगा');
add('Expected hash to compare', '비교할 해시 값', '用于比较的哈希值', 'तुलना हेतु अपेक्षित हैश');
add('Single file hash', '단일 파일 해시', '单文件哈希', 'एकल फ़ाइल हैश');
add('Case insensitive', '대소문자 무시', '不区分大小写', 'केस अनदेखा');
add('Sort ascending', '오름차순', '升序', 'आरोही क्रम');
add('Sort descending', '내림차순', '降序', 'अवरोही क्रम');
add('Remove blank lines', '빈 줄 제거', '删除空行', 'खाली पंक्तियाँ हटाएँ');
add('Remove duplicates', '중복 제거', '去除重复', 'डुप्लिकेट हटाएँ');
add('Trim lines', '줄 다듬기', '修剪行', 'पंक्तियाँ ट्रिम करें');
add('Find', '찾기', '查找', 'खोजें');
add('Replace', '바꾸기', '替换', 'बदलें');
add('Replace all', '모두 바꾸기', '全部替换', 'सभी बदलें');
add('Use regex', '정규식 사용', '使用正则', 'रेगेक्स उपयोग');
add('Ignore case', '대소문자 무시', '忽略大小写', 'केस अनदेखा');
add('Multiline', '여러 줄', '多行', 'मल्टीलाइन');
add('Global', '전체', '全局', 'ग्लोबल');
add('Pattern', '패턴', '模式', 'पैटर्न');
add('Test text', '테스트할 텍스트', '测试文本', 'टेस्ट टेक्स्ट');
add('Replacement', '바꿀 내용', '替换内容', 'प्रतिस्थापन');
add('Matches', '매치', '匹配', 'मैच');
add('No matches.', '매치 없음.', '无匹配。', 'कोई मैच नहीं।');
add('Input A', '입력 A', '输入 A', 'इनपुट A');
add('Input B', '입력 B', '输入 B', 'इनपुट B');
add('Left', '왼쪽', '左侧', 'बाएँ');
add('Right', '오른쪽', '右侧', 'दाएँ');
add('Indent', '들여쓰기', '缩进', 'इंडेंट');
add('Sort keys', '키 정렬', '排序键', 'कुंजियाँ क्रमबद्ध');
add('Spaces', '공백', '空格', 'स्पेस');
add('Tabs', '탭', '制表符', 'टैब');
add('Count', '개수', '数量', 'गिनती');
add('Version', '버전', '版本', 'संस्करण');
add('Hyphenated', '하이픈 포함', '带连字符', 'हाइफ़न सहित');
add('Uppercase UUID', '대문자 UUID', '大写 UUID', 'अपरकेस UUID');
add('Characters (no spaces)', '문자 (공백 제외)', '字符（不含空格）', 'अक्षर (बिना स्पेस)');
add('Bytes (UTF-8)', '바이트 (UTF-8)', '字节（UTF-8）', 'बाइट (UTF-8)');
add('Sentences (approx.)', '문장 (대략)', '句子（约）', 'वाक्य (लगभग)');
add('Enter text here', '여기에 텍스트를 입력하세요', '在此输入文本', 'यहाँ टेक्स्ट दर्ज करें');
add('No limit', '제한 없음', '无限制', 'कोई सीमा नहीं');
add('Keep non-Latin', '비라틴 문자 유지', '保留非拉丁字符', 'गैर-लैटिन रखें');
add('Remove non-Latin', '비라틴 문자 제거', '移除非拉丁字符', 'गैर-लैटिन हटाएँ');
add('Romanize', '로마자 변환', '罗马化', 'रोमनाइज़');
add('Max length', '최대 길이', '最大长度', 'अधिकतम लंबाई');
add('Separator', '구분자', '分隔符', 'विभाजक');
add('Low', '낮음', '低', 'कम');
add('Medium', '보통', '中', 'मध्यम');
add('High', '높음', '高', 'उच्च');
add('Now', '지금', '现在', 'अभी');
add('From Unix', 'Unix에서', '从 Unix', 'Unix से');
add('To Unix', 'Unix로', '转为 Unix', 'Unix में');
add('ISO date', 'ISO 날짜', 'ISO 日期', 'ISO तिथि');
add('px', 'px', 'px', 'px');
add('rem', 'rem', 'rem', 'rem');
add('File size', '파일 크기', '文件大小', 'फ़ाइल आकार');
add('From', '변환 전', '从', 'से');
add('To', '변환 후', '到', 'में');
add('Value', '값', '值', 'मान');
add('Result', '결과', '结果', 'परिणाम');
add('Options', '옵션', '选项', 'विकल्प');
add('Preview', '미리보기', '预览', 'प्रीव्यू');
add('Actions', '작업', '操作', 'क्रियाएँ');
add('Reset', '초기화', '重置', 'रीसेट');
add('Swap', '맞바꾸기', '交换', 'अदला-बदली');
add('Upload', '업로드', '上传', 'अपलोड');
add('Select file', '파일 선택', '选择文件', 'फ़ाइल चुनें');
add('Select files', '파일 선택', '选择文件', 'फ़ाइलें चुनें');
add('or', '또는', '或', 'या');
add('and', '및', '和', 'और');
add('Yes', '예', '是', 'हाँ');
add('No', '아니오', '否', 'नहीं');
add('On', '켜짐', '开', 'चालू');
add('Off', '꺼짐', '关', 'बंद');
add('Enabled', '사용', '启用', 'सक्षम');
add('Disabled', '사용 안 함', '禁用', 'अक्षम');
add('Optional', '선택', '可选', 'वैकल्पिक');
add('Required', '필수', '必填', 'आवश्यक');
add('Example', '예시', '示例', 'उदाहरण');
add('Help', '도움말', '帮助', 'सहायता');
add('Info', '안내', '信息', 'जानकारी');
add('Warning', '주의', '警告', 'चेतावनी');
add('Error', '오류', '错误', 'त्रुटि');
add('Cancel', '취소', '取消', 'रद्द करें');
add('OK', '확인', '确定', 'ठीक');
add('Save', '저장', '保存', 'सहेजें');
add('Continue', '계속', '继续', 'जारी रखें');
add('Back', '뒤로', '返回', 'वापस');
add('Next', '다음', '下一步', 'अगला');
add('Previous', '이전', '上一步', 'पिछला');
add('Home', '홈', '首页', 'होम');
add('Settings', '설정', '设置', 'सेटिंग्स');
add('Theme', '테마', '主题', 'थीम');
add('Language', '언어', '语言', 'भाषा');
add('Light', '라이트', '浅色', 'लाइट');
add('Dark', '다크', '深色', 'डार्क');
add('Browser only — files never leave your device.', '브라우저에서만 처리 — 파일이 기기를 떠나지 않습니다.', '仅在浏览器中处理 — 文件不会离开您的设备。', 'केवल ब्राउज़र — फ़ाइलें आपके डिवाइस से बाहर नहीं जातीं।');
add('All processing stays in your browser.', '모든 처리는 브라우저에서만 이루어집니다.', '所有处理均在浏览器中完成。', 'सारी प्रोसेसिंग आपके ब्राउज़र में ही रहती है।');

// ——— IMAGE / PDF tool extras ———
add('Width (px)', '가로 (px)', '宽度 (px)', 'चौड़ाई (px)');
add('Height (px)', '세로 (px)', '高度 (px)', 'ऊँचाई (px)');
add('Font size', '글자 크기', '字号', 'फ़ॉन्ट आकार');
add('Text', '텍스트', '文本', 'टेक्स्ट');
add('Tile repeat', '타일 반복', '平铺重复', 'टाइल दोहराएँ');
add('Image scale', '이미지 배율', '图片缩放', 'छवि स्केल');
add('Image opacity', '이미지 투명도', '图片不透明度', 'छवि अपारदर्शिता');
add('Image position', '이미지 위치', '图片位置', 'छवि स्थिति');
add('JPG quality', 'JPG 품질', 'JPG 质量', 'JPG गुणवत्ता');
add('Image quality', '이미지 품질', '图像质量', 'छवि गुणवत्ता');
add('Aspect ratio', '비율', '宽高比', 'अनुपात');
add('Free', '자유', '自由', 'मुक्त');
add('None (0°)', '없음 (0°)', '无 (0°)', 'कोई नहीं (0°)');
add('Right 90°', '오른쪽 90°', '向右 90°', 'दाएँ 90°');
add('Left 90°', '왼쪽 90°', '向左 90°', 'बाएँ 90°');
add('Clockwise 90°', '시계 방향 90°', '顺时针 90°', 'दक्षिणावर्त 90°');
add('Counterclockwise 90°', '반시계 90°', '逆时针 90°', 'वामावर्त 90°');
add('Multiple PDFs', 'PDF 여러 개', '多个 PDF', 'कई PDF');
add('Multiple JPGs allowed', 'JPG 여러 장 가능', '可多选 JPG', 'कई JPG अनुमत');
add('Create PDF', 'PDF 만들기', '创建 PDF', 'PDF बनाएँ');
add('Merging…', '합치는 중…', '正在合并…', 'मिलाया जा रहा है…');
add('Splitting…', '분할 중…', '正在拆分…', 'विभाजित हो रहा है…');
add('Creating PDF…', 'PDF 만드는 중…', '正在创建 PDF…', 'PDF बनाया जा रहा है…');
add('Converting to JPG…', 'JPG 변환 중…', '正在转换为 JPG…', 'JPG में बदला जा रहा है…');
add('Creating ZIP…', 'ZIP 만드는 중…', '正在创建 ZIP…', 'ZIP बनाया जा रहा है…');
add('Merge', '합치기', '合并', 'मिलाएँ');
add('Split', '분할', '拆分', 'विभाजित करें');
add('Merge failed.', '합치기에 실패했습니다.', '合并失败。', 'मिलाना विफल।');
add('Split failed.', '분할에 실패했습니다.', '拆分失败。', 'विभाजन विफल।');
add('Select at least 2 PDF files.', 'PDF를 2개 이상 선택하세요.', '请至少选择 2 个 PDF 文件。', 'कम से कम 2 PDF फ़ाइलें चुनें।');
add('Canvas is not available.', 'Canvas를 사용할 수 없습니다.', '无法使用 Canvas。', 'Canvas उपलब्ध नहीं है।');
add(
  'Could not open PDF. It may be damaged or unsupported.',
  'PDF를 열 수 없습니다. 손상되었거나 지원하지 않는 형식일 수 있습니다.',
  '无法打开 PDF。可能已损坏或不支持。',
  'PDF नहीं खोल सके। क्षतिग्रस्त या असमर्थित हो सकता है।'
);
add('Invalid date format.', '날짜 형식이 올바르지 않습니다.', '日期格式无效。', 'अमान्य तिथि प्रारूप।');
add('This PDF has no pages.', '페이지가 없는 PDF입니다.', '此 PDF 没有页面。', 'इस PDF में कोई पृष्ठ नहीं।');
add('Select pages to stamp.', '삽입할 페이지를 선택하세요.', '请选择要插入的页面。', 'स्टैम्प करने के लिए पृष्ठ चुनें।');
add('Select pages to rotate.', '회전할 페이지를 선택하세요.', '请选择要旋转的页面。', 'घुमाने के लिए पृष्ठ चुनें।');
add('Invalid page number.', '잘못된 페이지 번호입니다.', '页码无效。', 'अमान्य पृष्ठ संख्या।');
add('Thumbnail generation failed.', '썸네일 생성 실패', '缩略图生成失败', 'थंबनेल बनाना विफल।');
add('Select an image.', '이미지를 선택하세요.', '请选择图片。', 'एक छवि चुनें।');
add('Not an image file.', '이미지 파일이 아닙니다.', '不是图片文件。', 'छवि फ़ाइल नहीं है।');
add('Could not load image.', '이미지를 불러오지 못했습니다.', '无法加载图片。', 'छवि लोड नहीं हो सकी।');
add('Image conversion failed.', '이미지 변환에 실패했습니다.', '图片转换失败。', 'छवि रूपांतरण विफल।');
add('Width and height must be at least 1.', '가로·세로는 1 이상이어야 합니다.', '宽度和高度必须至少为 1。', 'चौड़ाई और ऊँचाई कम से कम 1 होनी चाहिए।');
add('Enter a valid color code.', '올바른 색상 코드를 입력하세요.', '请输入有效的颜色代码。', 'मान्य रंग कोड दर्ज करें।');
add('Enter a text or image watermark.', '텍스트 또는 이미지 워터마크를 입력하세요.', '请输入文字或图片水印。', 'टेक्स्ट या छवि वॉटरमार्क दर्ज करें।');
add(
  'Convert PNG to JPG. Transparent backgrounds become white.',
  'PNG 이미지를 JPG로 변환합니다. 투명 배경은 흰색으로 처리됩니다.',
  '将 PNG 转换为 JPG。透明背景会变为白色。',
  'PNG को JPG में बदलें। पारदर्शी पृष्ठभूमि सफ़ेद हो जाती है।'
);
add('Original preview', '원본 미리보기', '原图预览', 'मूल प्रीव्यू');
add('Crop target', '자르기 대상', '裁剪对象', 'क्रॉप लक्ष्य');
add(
  'Combine PDFs in the selected order. Use ↑↓ to reorder.',
  '선택한 순서대로 PDF를 하나로 합칩니다. ↑↓로 순서를 바꿀 수 있습니다.',
  '按所选顺序合并 PDF。可用 ↑↓ 调整顺序。',
  'चयनित क्रम में PDF मिलाएँ। क्रम बदलने के लिए ↑↓ उपयोग करें।'
);
add(
  'Put JPG images as pages into a PDF. Use ↑↓ to reorder.',
  'JPG 이미지를 페이지로 넣어 PDF를 만듭니다. ↑↓로 페이지 순서를 바꿀 수 있습니다.',
  '将 JPG 图片作为页面放入 PDF。可用 ↑↓ 调整顺序。',
  'JPG छवियों को पृष्ठों के रूप में PDF में डालें। क्रम बदलने के लिए ↑↓ उपयोग करें।'
);
add(
  'Fit the image to a square and export {sizes}px PNG ZIP.',
  '이미지를 정사각으로 맞춰 {sizes}px PNG ZIP을 만듭니다.',
  '将图片裁为正方形并导出 {sizes}px PNG ZIP。',
  'छवि को वर्ग में फिट कर {sizes}px PNG ZIP निर्यात करें।'
);

// Header already has Image for 이미지 category; MENU uses Image not 이미지
add('tools', '도구', '工具', 'टूल्स');
add('image tools', '이미지 도구', '图片工具', 'छवि टूल्स');
add('pdf tools', 'PDF 도구', 'PDF 工具', 'PDF टूल्स');
add('format tools', 'FORMAT 도구', 'FORMAT 工具', 'FORMAT टूल्स');
add('edit tools', 'EDIT 도구', 'EDIT टूल्स', 'EDIT टूल्स');
add('util tools', 'UTIL 도구', 'UTIL 工具', 'UTIL टूल्स');

// ——— FORMAT / EDIT / UTIL UI + module keys ———
add('Input', '입력', '输入', 'इनपुट');
add('File', '파일', '文件', 'फ़ाइल');
add('line', '줄', '行', 'पंक्ति');
add('column', '열', '列', 'स्तंभ');
add('Dialect', '방언', '方言', 'डायलेक्ट');
add('Keywords', '키워드', '关键字', 'कीवर्ड');
add('Preserve', '유지', '保留', 'रखें');
add('Query spacing', '쿼리 간격', '查询间距', 'क्वेरी अंतराल');
add('0 lines', '0줄', '0 行', '0 पंक्तियाँ');
add('1 line', '1줄', '1 行', '1 पंक्ति');
add('2 lines', '2줄', '2 行', '2 पंक्तियाँ');
add(
  'Basic validation passed (quotes and parentheses).',
  '기본 유효성 검사 통과 (따옴표·괄호).',
  '基础校验通过（引号与括号）。',
  'मूल सत्यापन पास (उद्धरण और कोष्ठक)।'
);
add('SQL formatting failed.', 'SQL 정렬에 실패했습니다.', 'SQL 格式化失败。', 'SQL फ़ॉर्मैटिंग विफल।');
add('Unbalanced parentheses. Extra ).', '괄호가 올바르지 않습니다. ) 가 더 많습니다.', '括号不匹配，多余 )。', 'असंतुलित कोष्ठक। अतिरिक्त )।');
add('Unclosed quotes.', '따옴표가 닫히지 않았습니다.', '引号未闭合。', 'उद्धरण बंद नहीं।');
add('Encoding failed.', '인코딩에 실패했습니다.', '编码失败。', 'एन्कोडिंग विफल।');
add('Invalid Base64 string.', '유효하지 않은 Base64 문자열입니다.', '无效的 Base64 字符串。', 'अमान्य Base64 स्ट्रिंग।');
add('Decoding failed.', '디코딩에 실패했습니다.', '解码失败。', 'डिकोडिंग विफल।');
add('File conversion failed.', '파일 변환에 실패했습니다.', '文件转换失败。', 'फ़ाइल रूपांतरण विफल।');
add(
  'Decoding failed. (Invalid % escape?)',
  '디코딩에 실패했습니다. (잘못된 % 이스케이프일 수 있습니다.)',
  '解码失败。（可能是无效的 % 转义）',
  'डिकोडिंग विफल। (अमान्य % एस्केप?)'
);
add('JSON conversion failed.', 'JSON 변환에 실패했습니다.', 'JSON 转换失败。', 'JSON रूपांतरण विफल।');
add(
  'JSON must be an array (of objects or arrays).',
  'JSON은 배열이어야 합니다. (객체 배열 또는 2차원 배열)',
  'JSON 必须是数组（对象数组或二维数组）。',
  'JSON ऐरे होना चाहिए (ऑब्जेक्ट या ऐरे)।'
);
add(
  'Array items must be objects or arrays.',
  '배열 요소는 객체이거나 배열이어야 합니다.',
  '数组元素必须是对象或数组。',
  'ऐरे आइटम ऑब्जेक्ट या ऐरे होने चाहिए।'
);
add('CSV conversion failed.', 'CSV 변환에 실패했습니다.', 'CSV 转换失败。', 'CSV रूपांतरण विफल।');
add('Enter a color.', '색상을 입력하세요.', '请输入颜色。', 'रंग दर्ज करें।');
add(
  'Invalid HEX. (#RGB or #RRGGBB)',
  '유효하지 않은 HEX입니다. (#RGB 또는 #RRGGBB)',
  '无效的 HEX。（#RGB 或 #RRGGBB）',
  'अमान्य HEX। (#RGB या #RRGGBB)'
);
add(
  'Supports HEX, rgb(), and hsl().',
  'HEX, rgb(), hsl() 형식을 지원합니다.',
  '支持 HEX、rgb()、hsl() 格式。',
  'HEX, rgb(), hsl() समर्थित।'
);
add('Enter a JWT.', 'JWT를 입력하세요.', '请输入 JWT。', 'JWT दर्ज करें।');
add(
  'JWT must be header.payload[.signature].',
  'JWT는 header.payload[.signature] 형식이어야 합니다.',
  'JWT 必须为 header.payload[.signature] 格式。',
  'JWT header.payload[.signature] होना चाहिए।'
);
add('Header is not an object.', 'Header가 객체가 아닙니다.', 'Header 不是对象。', 'Header ऑब्जेक्ट नहीं है।');
add('Payload is not an object.', 'Payload가 객체가 아닙니다.', 'Payload 不是对象。', 'Payload ऑब्जेक्ट नहीं है।');
add(
  'No signature or alg=none — token is not verified.',
  '서명 없음 또는 alg=none — 검증되지 않은 토큰입니다.',
  '无签名或 alg=none — 令牌未验证。',
  'कोई हस्ताक्षर नहीं या alg=none — टोकन सत्यापित नहीं।'
);
add(
  'Signature is decoded only; it is not verified.',
  '서명은 디코딩만 하며 검증하지 않습니다.',
  '仅解码签名，不进行验证。',
  'हस्ताक्षर केवल डिकोड; सत्यापित नहीं।'
);
add('Token is expired (exp).', '만료된 토큰입니다 (exp).', '令牌已过期 (exp)。', 'टोकन समाप्त (exp)।');
add('(none)', '(없음)', '(无)', '(कोई नहीं)');
add('JWT decoding failed.', 'JWT 디코딩에 실패했습니다.', 'JWT 解码失败。', 'JWT डिकोडिंग विफल।');
add('Enter a find string.', '찾을 문자열을 입력하세요.', '请输入要查找的字符串。', 'खोज स्ट्रिंग दर्ज करें।');
add('Invalid regular expression.', '잘못된 정규식입니다.', '无效的正则表达式。', 'अमान्य रेगुलर एक्सप्रेशन।');
add('Enter a pattern.', '패턴을 입력하세요.', '请输入模式。', 'पैटर्न दर्ज करें।');
add('Enter a valid number.', '유효한 숫자를 입력하세요.', '请输入有效数字。', 'मान्य संख्या दर्ज करें।');
add('Kelvin must be 0 or greater.', '켈빈은 0 이상이어야 합니다.', '开尔文必须大于或等于 0。', 'केल्विन 0 या अधिक होना चाहिए।');
add('Enter a value.', '값을 입력하세요.', '请输入值。', 'मान दर्ज करें।');
add('Invalid number.', '숫자가 유효하지 않습니다.', '数字无效。', 'अमान्य संख्या।');
add('Could not parse date.', '날짜를 해석할 수 없습니다.', '无法解析日期。', 'तिथि पार्स नहीं हो सकी।');
add(
  'Select at least one character set.',
  '최소 하나의 문자 집합을 선택하세요.',
  '请至少选择一种字符集。',
  'कम से कम एक कैरेक्टर सेट चुनें।'
);
add('Weak', '약함', '弱', 'कमज़ोर');
add('Fair', '보통', '一般', 'ठीक');
add('Good', '좋음', '良好', 'अच्छा');
add('Strong', '강함', '强', 'मज़बूत');
add('QR foreground', 'QR 전경색', '二维码前景色', 'QR अग्रभूमि');
add('QR background', 'QR 배경색', '二维码背景色', 'QR पृष्ठभूमि');
add('Generated QR code', '생성된 QR 코드', '生成的二维码', 'जेनरेटेड QR कोड');
add('PNG downloaded.', 'PNG를 다운로드했습니다.', '已下载 PNG。', 'PNG डाउनलोड हो गया।');
add('Download failed.', '다운로드에 실패했습니다.', '下载失败。', 'डाउनलोड विफल।');
add('QR generation failed.', 'QR 생성에 실패했습니다.', '二维码生成失败。', 'QR बनाना विफल।');
add('Encoded as Base64.', 'Base64로 인코딩했습니다.', '已编码为 Base64。', 'Base64 में एन्कोड किया।');
add('Decoded Base64.', 'Base64를 디코딩했습니다.', '已解码 Base64。', 'Base64 डिकोड किया।');
add(
  'Text to encode or Base64 string',
  '인코딩할 텍스트 또는 Base64 문자열',
  '要编码的文本或 Base64 字符串',
  'एन्कोड टेक्स्ट या Base64 स्ट्रिंग'
);
add('Result → input', '결과→입력', '结果→输入', 'परिणाम→इनपुट');
add(
  'Component (encodeURIComponent)',
  '컴포넌트 (encodeURIComponent)',
  '组件 (encodeURIComponent)',
  'कंपोनेंट (encodeURIComponent)'
);
add('Full URL (encodeURI)', '전체 URL (encodeURI)', '完整 URL (encodeURI)', 'पूरा URL (encodeURI)');
add(
  'Search term / path / query value',
  '검색어 / 경로 / 쿼리 값',
  '搜索词 / 路径 / 查询值',
  'खोज शब्द / पथ / क्वेरी मान'
);
add('Algorithm', '알고리즘', '算法', 'एल्गोरिदम');
add('Uppercase HEX', '대문자 HEX', '大写 HEX', 'अपरकेस HEX');
add('Calculating…', '계산 중…', '计算中…', 'गणना हो रही है…');
add('Hash result', '해시 결과', '哈希结果', 'हैश परिणाम');
add('Expected hash (optional)', '예상 해시 비교 (선택)', '预期哈希（可选）', 'अपेक्षित हैश (वैकल्पिक)');
add('Converted to JSON.', 'JSON으로 변환했습니다.', '已转换为 JSON。', 'JSON में बदला।');
add('Converted to CSV.', 'CSV로 변환했습니다.', '已转换为 CSV。', 'CSV में बदला।');
add('Comma (,)', '쉼표 (,)', '逗号 (,)', 'अल्पविराम (,)');
add('Semicolon (;)', '세미콜론 (;)', '分号 (;)', 'सेमीकोलन (;)');
add('Tab', '탭', '制表符', 'टैब');
add('Pipe (|)', '파이프 (|)', '竖线 (|)', 'पाइप (|)');
add('First row as header', '첫 행을 헤더로', '第一行作为表头', 'पहली पंक्ति हेडर');
add('Include header', '헤더 포함', '包含表头', 'हेडर शामिल');
add('Pretty JSON', '예쁜 JSON', '美化 JSON', 'प्रीटी JSON');
add(
  'Result → input · switch mode',
  '결과→입력 · 모드 전환',
  '结果→输入 · 切换模式',
  'परिणाम→इनपुट · मोड बदलें'
);
add('Line breaks → <br>', '줄바꿈 → <br>', '换行 → <br>', 'लाइन ब्रेक → <br>');
add('Copy HTML', 'HTML 복사', '复制 HTML', 'HTML कॉपी');
add('No HTML to copy.', '복사할 HTML이 없습니다.', '没有可复制的 HTML。', 'कॉपी करने के लिए HTML नहीं।');
add('HTML copied.', 'HTML을 복사했습니다.', '已复制 HTML。', 'HTML कॉपी हो गया।');
add('Color preview', '색상 미리보기', '颜色预览', 'रंग प्रीव्यू');
add('Picker', '피커', '取色器', 'पिकर');
add('Contrast on white', '흰 배경 대비', '白底对比度', 'सफ़ेद पर कंट्रास्ट');
add('Contrast on black', '검 배경 대비', '黑底对比度', 'काले पर कंट्रास्ट');
add(' (AA pass)', ' (AA 통과)', '（AA 通过）', ' (AA पास)');
add(' (AA fail)', ' (AA 미달)', '（AA 未通过）', ' (AA फ़ेल)');
add('Suggested text color:', '권장 텍스트 색:', '建议文本色：', 'सुझाया टेक्स्ट रंग:');
add('Copy HEX', 'HEX 복사', '复制 HEX', 'HEX कॉपी');
add('Copy RGB', 'RGB 복사', '复制 RGB', 'RGB कॉपी');
add('Copy HSL', 'HSL 복사', '复制 HSL', 'HSL कॉपी');
add('Copied HEX.', 'HEX을(를) 복사했습니다.', '已复制 HEX。', 'HEX कॉपी हो गया।');
add('Copied RGB.', 'RGB을(를) 복사했습니다.', '已复制 RGB。', 'RGB कॉपी हो गया।');
add('Copied HSL.', 'HSL을(를) 복사했습니다.', '已复制 HSL。', 'HSL कॉपी हो गया।');
add('Copied Payload.', 'Payload을(를) 복사했습니다.', '已复制 Payload。', 'Payload कॉपी हो गया।');
add('Copied Header.', 'Header을(를) 복사했습니다.', '已复制 Header。', 'Header कॉपी हो गया।');
add('Token', '토큰', '令牌', 'टोकन');
add('Copy Payload', 'Payload 복사', '复制 Payload', 'Payload कॉपी');
add('Copy Header', 'Header 복사', '复制 Header', 'Header कॉपी');
add(
  'Ignore leading/trailing spaces',
  '앞뒤 공백 무시',
  '忽略首尾空格',
  'आगे/पीछे स्पेस अनदेखा'
);
add('Ignore blank lines', '빈 줄 무시', '忽略空行', 'खाली पंक्तियाँ अनदेखा');
add('Show differences only', '차이만 보기', '仅显示差异', 'केवल अंतर दिखाएँ');
add('Left (original)', '왼쪽 (원본)', '左侧（原）', 'बाएँ (मूल)');
add('Right (compare)', '오른쪽 (비교)', '右侧（对比）', 'दाएँ (तुलना)');
add('Original text', '원본 텍스트', '原文', 'मूल टेक्स्ट');
add('Text to compare', '비교할 텍스트', '要对比的文本', 'तुलना टेक्स्ट');
add('Swap left/right', '좌우 바꾸기', '左右对调', 'बाएँ/दाएँ बदलें');
add('Same', '동일', '相同', 'समान');
add('Added', '추가', '新增', 'जोड़ा');
add('Removed', '삭제', '删除', 'हटाया');
add('No differences to show.', '표시할 차이가 없습니다.', '没有可显示的差异。', 'दिखाने के लिए कोई अंतर नहीं।');
add('Newline', '줄바꿈', '换行', 'नई पंक्ति');
add('Space', '공백', '空格', 'स्पेस');
add('Ignore empty items', '빈 항목 무시', '忽略空项', 'खाली आइटम अनदेखा');
add('Sort result', '결과 정렬', '结果排序', 'परिणाम क्रमबद्ध');
add('No duplicates.', '중복이 없습니다.', '没有重复项。', 'कोई डुप्लिकेट नहीं।');
add('Removed {n} duplicates.', '{n}개 중복을 제거했습니다.', '已去除 {n} 个重复项。', '{n} डुप्लिकेट हटाए।');
add('Apply to input', '결과에 반영', '应用到输入', 'इनपुट पर लागू');
add('Unique', '유일', '唯一', 'अद्वितीय');
add('Sort by', '정렬 기준', '排序依据', 'क्रमबद्ध करें');
add('Alphabetical', '사전순', '字母顺序', 'वर्णानुक्रम');
add('Numeric', '숫자 인식', '数字识别', 'संख्यात्मक');
add('Reverse', '역순', '倒序', 'उल्टा');
add('Sort', '정렬', '排序', 'क्रमबद्ध');
add('Sorted {n} lines.', '{n}줄을 정렬했습니다.', '已排序 {n} 行。', '{n} पंक्तियाँ क्रमबद्ध।');
add('Style', '스타일', '样式', 'शैली');
add('Literal', '문자열', '字面量', 'लिटरल');
add('Text to find', '찾을 텍스트', '要查找的文本', 'खोजने का टेक्स्ट');
add('Replacement text', '바꿀 텍스트', '替换文本', 'प्रतिस्थापन टेक्स्ट');
add('{n} matches', '일치 {n}곳', '{n} 处匹配', '{n} मैच');
add('Replaced {n} matches.', '{n}곳을 바꿨습니다.', '已替换 {n} 处。', '{n} मैच बदले।');
add('Non-Latin handling', '비라틴 문자 처리', '非拉丁字符处理', 'गैर-लैटिन हैंडलिंग');
add('Test string', '테스트 문자열', '测试字符串', 'टेस्ट स्ट्रिंग');
add('Match list', '매치 목록', '匹配列表', 'मैच सूची');
add('Replace preview', '바꾸기 미리보기', '替换预览', 'रिप्लेस प्रीव्यू');
add('Copy preview', '미리보기 복사', '复制预览', 'प्रीव्यू कॉपी');
add('Digits', '숫자', '数字', 'अंक');
add('Symbols', '기호', '符号', 'प्रतीक');
add('Exclude similar (0OIl1)', '유사 문자 제외 (0OIl1)', '排除易混字符 (0OIl1)', 'मिलते अक्षर छोड़ें (0OIl1)');
add('Entropy', '엔트로피', '熵', 'एन्ट्रॉपी');
add('Generated {n}.', '{n}개 생성했습니다.', '已生成 {n} 个。', '{n} बनाए।');
add('Now (ms)', '지금 (ms)', '现在 (ms)', 'अब (ms)');
add('Now (seconds)', '지금 (초)', '现在（秒）', 'अब (सेकंड)');
add('Local', '로컬', '本地', 'स्थानीय');
add(
  'Input (Unix s/ms or ISO)',
  '입력 (Unix 초·ms 또는 ISO)',
  '输入（Unix 秒/毫秒或 ISO）',
  'इनपुट (Unix सेकंड/ms या ISO)'
);
add('Milliseconds', '밀리초', '毫秒', 'मिलीसेकंड');
add('Seconds', '초', '秒', 'सेकंड');
add('Category', '종류', '类别', 'श्रेणी');
add('Base (1rem)', '기준 (1rem)', '基准 (1rem)', 'आधार (1rem)');
add('Swap units', '단위 바꾸기', '交换单位', 'इकाई बदलें');
add('No result to copy.', '복사할 결과가 없습니다.', '没有可复制的结果。', 'कॉपी करने के लिए परिणाम नहीं।');

// ——— Member auth ———
add('Login', '로그인', '登录', 'लॉगिन');
add('Register', '회원가입', '注册', 'पंजीकरण');
add('Email', '이메일', '邮箱', 'ईमेल');
add('Confirm password', '비밀번호 확인', '确认密码', 'पासवर्ड पुष्टि');
add('Save email', '아이디 저장', '保存账号', 'ईमेल सहेजें');
add('Member', 'Member', 'Member', 'Member');
add('Login failed.', '로그인에 실패했습니다.', '登录失败。', 'लॉगिन विफल।');
add('No account? ', '계정이 없으면 ', '没有账号？', 'खाता नहीं है? ');
add('Find ID', '아이디 찾기', '找回账号', 'आईडी खोजें');
add('Forgot password', '비밀번호 찾기', '找回密码', 'पासवर्ड भूल गए');
add('Send verification code', '인증번호 받기', '获取验证码', 'सत्यापन कोड भेजें');
add('6-digit code', '인증번호 6자리', '6位验证码', '6 अंकों का कोड');
add('Resend', '다시 받기', '重新发送', 'फिर भेजें');
add('Sign up', '가입하기', '注册', 'साइन अप');
add('Already have an account? ', '이미 계정이 있으면 ', '已有账号？', 'पहले से खाता है? ');
add(
  'We sent a verification code to your email. Enter it within 5 minutes. Check spam if you do not see it.',
  '인증번호를 메일로 보냈습니다. 5분 안에 입력해 주세요. 메일이 없으면 스팸함을 확인해 주세요.',
  '验证码已发送到邮箱，请在5分钟内输入。如未收到请检查垃圾邮件。',
  'हमने ईमेल पर सत्यापन कोड भेजा है। 5 मिनट में दर्ज करें। न दिखे तो स्पैम जांचें।'
);
add('Failed to send verification code.', '인증번호 발송에 실패했습니다.', '验证码发送失败。', 'सत्यापन कोड भेजने में विफल।');
add('Please request a verification code first.', '인증번호 받기를 먼저 진행해 주세요.', '请先获取验证码。', 'पहले सत्यापन कोड का अनुरोध करें।');
add('Passwords do not match.', '비밀번호가 일치하지 않습니다.', '密码不一致。', 'पासवर्ड मेल नहीं खाते।');
add('Registration failed.', '회원가입에 실패했습니다.', '注册失败。', 'पंजीकरण विफल।');
add(
  'If you request a new code, the previous one will no longer work. ',
  '인증번호를 다시 받으면 이전 번호는 사용할 수 없습니다. ',
  '重新获取后，旧验证码将失效。',
  'नया कोड मांगने पर पुराना कोड काम नहीं करेगा। '
);
add('Account settings', '회원 설정', '账号设置', 'खाता सेटिंग');
add('Logout', '로그아웃', '退出登录', 'लॉग आउट');
add('Change password', '비밀번호 변경', '修改密码', 'पासवर्ड बदलें');
add('Current password', '현재 비밀번호', '当前密码', 'वर्तमान पासवर्ड');
add('New password', '새 비밀번호', '新密码', 'नया पासवर्ड');
add('Confirm new password', '새 비밀번호 확인', '确认新密码', 'नया पासवर्ड पुष्टि');
add('Close', '닫기', '关闭', 'बंद करें');
add('Change', '변경', '更改', 'बदलें');
add('New passwords do not match.', '새 비밀번호가 일치하지 않습니다.', '新密码不一致。', 'नए पासवर्ड मेल नहीं खाते।');
add('Password changed.', '비밀번호가 변경되었습니다.', '密码已更改。', 'पासवर्ड बदल दिया गया।');
add('Change failed.', '변경에 실패했습니다.', '更改失败。', 'परिवर्तन विफल।');
add(
  'Recover your login ID by verifying the email you used to sign up.',
  '가입 시 사용한 이메일로 인증 후, 로그인 아이디를 메일로 안내합니다.',
  '验证注册邮箱后，将把登录账号发送到该邮箱。',
  'साइन अप ईमेल सत्यापित करके लॉगिन आईडी पाएँ।'
);
add('Email me my ID', '아이디 메일로 받기', '把账号发到邮箱', 'आईडी ईमेल करें');
add('Go to login', '로그인으로 이동', '前往登录', 'लॉगिन पर जाएँ');
add(
  'We sent your login ID to your email. Check your inbox.',
  '가입 아이디를 이메일로 보냈습니다. 메일함을 확인해 주세요.',
  '登录账号已发送到邮箱，请查收。',
  'लॉगिन आईडी ईमेल पर भेज दी गई है। इनबॉक्स जांचें।'
);
add('Could not find your ID.', '아이디 찾기에 실패했습니다.', '未能找回账号。', 'आईडी नहीं मिल सकी।');
add(
  'Verify your signup email, then set a new password.',
  '가입 이메일 인증 후 새 비밀번호로 변경할 수 있습니다.',
  '验证注册邮箱后即可设置新密码。',
  'साइन अप ईमेल सत्यापित करके नया पासवर्ड सेट करें।'
);
add(
  'Password updated. Sign in with your new password.',
  '비밀번호가 변경되었습니다. 새 비밀번호로 로그인해 주세요.',
  '密码已更改，请用新密码登录。',
  'पासवर्ड अपडेट हो गया। नए पासवर्ड से साइन इन करें।'
);
add('Could not reset password.', '비밀번호 변경에 실패했습니다.', '无法重置密码।', 'पासवर्ड रीसेट नहीं हो सका।');

const keys = Object.keys(d);
const lines = [
  '/**',
  ' * Hardcoded UI dictionary. English message keys map to ko / zh / hi.',
  ' * Generated by scripts/write-i18n-dictionary.mjs — re-run to regenerate.',
  ' */',
  '',
  "export const dictionary: Record<string, Partial<Record<'ko' | 'zh' | 'hi', string>>> = {"
];

for (const key of keys) {
  const {ko, zh, hi} = d[key];
  lines.push(`  ${JSON.stringify(key)}: {`);
  lines.push(`    ko: ${JSON.stringify(ko)},`);
  lines.push(`    zh: ${JSON.stringify(zh)},`);
  lines.push(`    hi: ${JSON.stringify(hi)}`);
  lines.push('  },');
}

lines.push('};');
lines.push('');
lines.push(`export const DICTIONARY_KEY_COUNT = ${keys.length} as const;`);
lines.push('');

writeFileSync(outPath, lines.join('\n'), 'utf8');
console.log(`Wrote ${keys.length} keys to ${outPath}`);
