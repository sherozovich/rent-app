/**
 * pdfmake document definitions for DOKON documents.
 * Both are opened in a new browser tab for printing.
 */

function formatDate(dateStr) {
  if (!dateStr) return '___________'
  const d = new Date(dateStr)
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatDateShort(dateStr) {
  if (!dateStr) return '___'
  const months = [
    'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
    'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
  ]
  const d = new Date(dateStr + 'T00:00:00')
  return `«${d.getDate()}» ${months[d.getMonth()]} ${d.getFullYear()} г.`
}

function cb(checked) {
  return checked ? '☑' : '☐'
}

function fmtPrice(amount) {
  if (!amount) return '_____'
  return Number(amount).toLocaleString('ru-RU')
}

/**
 * Rental Agreement (Договор аренды) document definition.
 * Matches the official DOKON TEAM rental agreement format.
 */
export function rentalAgreementDoc(rental) {
  const { agreement_no, courier, scooter, tariff, start_date, end_date, agreed_price } = rental
  const price = fmtPrice(agreed_price)

  return {
    content: [
      // Title
      { text: 'ДОГОВОР АРЕНДЫ СКУТЕРА', style: 'title', margin: [0, 0, 0, 6] },
      {
        text: [
          { text: `№${agreement_no}`, bold: true },
          { text: ` / Дата: ${formatDateShort(start_date)}` },
        ],
        style: 'subtitle',
      },
      { text: 'г. Ташкент', style: 'subtitle', margin: [0, 0, 0, 20] },

      // 1. Parties
      { text: '1. СТОРОНЫ ДОГОВОРА', style: 'sectionHeader' },
      {
        text: [
          { text: 'ООО "DOKON TEAM"' , bold: true },
          { text: ', в лице ' },
          { text: 'Акромов Жахонгир Шероз угли', bold: true },
          { text: ', действующего на основании Устава, далее именуемое ' },
          { text: '"Арендодатель"', bold: true },
          { text: ', с одной стороны, и гражданин(ка) ' },
          { text: courier?.full_name || '_______________________', bold: true },
          { text: ', паспорт № ' },
          { text: courier?.passport_no || '____________', bold: true },
          { text: ', проживающий по адресу: ' },
          { text: courier?.address || '_______________________________', bold: true },
          { text: ', далее именуемый ' },
          { text: '"Арендатор"', bold: true },
          { text: ', с другой стороны, заключили настоящий договор о нижеследующем:' },
        ],
        style: 'body',
        margin: [0, 0, 0, 14],
      },

      // 2. Subject
      { text: '2. ПРЕДМЕТ ДОГОВОРА', style: 'sectionHeader' },
      {
        text: '2.1. Арендодатель передает, а Арендатор принимает во временное пользование транспортное средство — ',
        style: 'body',
      },
      {
        text: [
          { text: 'скутер' , bold: true },
          { text: ', а также комплект экипировки (шлем и перчатки).' },
        ],
        style: 'body',
        margin: [0, 0, 0, 6],
      },
      { text: '2.2. Данные скутера:', style: 'body', margin: [0, 0, 0, 4] },
      {
        ul: [
          { text: [{ text: 'Марка/модель: ' }, { text: scooter?.model || '_______________________', bold: true }] },
          { text: [{ text: 'Цвет: ' }, { text: 'Чёрный', bold: true }] },
          { text: [{ text: 'Гос. номер: ' }, { text: scooter?.plate || '_______________________', bold: true }] },
          { text: [{ text: 'VIN (если есть): ' }, { text: scooter?.vin || '_______________________', bold: true }] },
        ],
        style: 'body',
        margin: [10, 0, 0, 14],
      },

      // 3. Terms
      { text: '3. СРОК И УСЛОВИЯ АРЕНДЫ', style: 'sectionHeader' },
      { text: '3.1. Скутер предоставляется в аренду на срок:', style: 'body', margin: [0, 0, 0, 4] },
      {
        text: `${cb(tariff === 'daily')} суточный (${tariff === 'daily' ? price : '_____'} сум/аренда)`,
        style: 'body',
        margin: [10, 0, 0, 2],
      },
      {
        text: `${cb(tariff === 'weekly')} недельный (${tariff === 'weekly' ? price : '_____'} сум/неделя)`,
        style: 'body',
        margin: [10, 0, 0, 2],
      },
      {
        text: `${cb(tariff === 'monthly')} месяцев (${tariff === 'monthly' ? price : '_____'} сум/месяц)`,
        style: 'body',
        margin: [10, 0, 0, 6],
      },
      {
        text: [
          { text: 'Период аренды: с ' },
          { text: formatDateShort(start_date), bold: true },
          { text: ' по ' },
          { text: formatDateShort(end_date), bold: true },
        ],
        style: 'body',
        margin: [10, 0, 0, 6],
      },
      {
        text: [
          { text: '3.2. Арендная плата оплачивается ' },
          { text: 'в полном объеме авансом', bold: true },
          { text: '. Возврат средств при досрочном прекращении аренды не производится.' },
        ],
        style: 'body',
        margin: [0, 0, 0, 6],
      },
      {
        text: [
          { text: '3.3. Дополнительно может взиматься ' },
          { text: 'возвращаемый депозит', bold: true },
          { text: ' в размере ________ сум.' },
        ],
        style: 'body',
        margin: [0, 0, 0, 14],
      },

      // 4. Tenant obligations
      { text: '4. ОБЯЗАННОСТИ АРЕНДАТОРА', style: 'sectionHeader' },
      { text: '4.1. Арендатор обязан:', style: 'body', margin: [0, 0, 0, 4] },
      {
        ul: [
          'использовать мобильное приложение DOKON для ежедневной регистрации поездок;',
          { text: [{ text: 'каждый день перед началом работы', bold: true }, { text: ' ввести текущий километраж скутера и загрузить фотографии ' }, { text: 'спереди и сзади', bold: true }, { text: ';' }] },
          { text: [{ text: 'в конце смены', bold: true }, { text: ' ввести новый километраж и также загрузить фотографии;' }] },
          'своевременно заправлять скутер топливом;',
          'самостоятельно оплачивать текущий ремонт, замену шин, масла и т.д.;',
          'при повреждении, утере или угоне скутера — возместить его полную рыночную стоимость;',
          'соблюдать ПДД и не передавать скутер третьим лицам;',
          'зафиксировать факт возвращения скутера Арендодателю (оформление акта приема-передачи/сканирование QR-кода).',
        ],
        style: 'body',
        margin: [10, 0, 0, 6],
      },
      { text: '4.2. Все штрафы, полученные в период аренды, возлагаются на Арендатора.', style: 'body', margin: [0, 0, 0, 6] },
      { text: '4.3. В случае утраты экипировки (шлем, перчатки) Арендатор обязуется компенсировать их стоимость.', style: 'body', margin: [0, 0, 0, 14] },

      // 5. Landlord obligations
      { text: '5. ОБЯЗАННОСТИ АРЕНДОДАТЕЛЯ', style: 'sectionHeader' },
      { text: '5.1. Передать исправный скутер с полным комплектом экипировки.', style: 'body', margin: [0, 0, 0, 4] },
      { text: '5.2. Иметь право в одностороннем порядке расторгнуть договор в случае нарушения условий аренды.', style: 'body', margin: [0, 0, 0, 4] },
      { text: '5.3. Контролировать местоположение скутера с помощью GPS (если установлено).', style: 'body', margin: [0, 0, 0, 14] },

      // 6. Technical control
      { text: '6. ТЕХНИЧЕСКИЙ КОНТРОЛЬ И ФОТОФИКСАЦИЯ', style: 'sectionHeader' },
      { text: [{ text: '6.1. Арендатор обязуется ' }, { text: 'ежедневно', bold: true }, { text: ', используя приложение DOKON:' }], style: 'body', margin: [0, 0, 0, 4] },
      {
        ul: [
          'Вводить актуальные показания одометра',
          'Загружать фотографии скутера (спереди и сзади)',
        ],
        style: 'body',
        margin: [10, 0, 0, 6],
      },
      {
        text: [
          { text: '6.2. Эти данные хранятся в системе DOKON и являются ' },
          { text: 'доказательством технического состояния скутера', bold: true },
          { text: ' на каждый день аренды.' },
        ],
        style: 'body',
        margin: [0, 0, 0, 6],
      },
      { text: '6.3. В случае обнаружения скрытых повреждений, резкого увеличения пробега, нарушений маршрута — Арендодатель имеет право вычесть из депозита или взыскать с Арендатора соответствующую сумму.', style: 'body', margin: [0, 0, 0, 14] },

      // 7. Responsibility
      { text: '7. ОТВЕТСТВЕННОСТЬ', style: 'sectionHeader' },
      { text: '7.1. Арендатор в полном объеме несет материальную ответственность за сохранность скутера и за всякий ущерб, как в результате умышленных действий, так и в результате небрежного или недобросовестного отношения к своим обязанностям, с момента фактического приема им скутера.', style: 'body', margin: [0, 0, 0, 6] },
      { text: '7.2. В случае ДТП, угона, хищения или повреждения скутера — ответственность несет Арендатор.', style: 'body', margin: [0, 0, 0, 6] },
      { text: '7.3. В случае нарушения пункта 6 (отсутствие фото и километража) — Арендодатель может приостановить аренду.', style: 'body', margin: [0, 0, 0, 14] },

      // 8. Final
      { text: '8. ЗАКЛЮЧИТЕЛЬНЫЕ ПОЛОЖЕНИЯ', style: 'sectionHeader' },
      { text: '8.1. Настоящий договор вступает в силу с момента подписания.', style: 'body', margin: [0, 0, 0, 4] },
      { text: '8.2. Подписывается в двух экземплярах, по одному для каждой стороны.', style: 'body', margin: [0, 0, 0, 4] },
      { text: '8.3. Неотъемлемыми приложениями являются:', style: 'body', margin: [0, 0, 0, 4] },
      {
        ul: [
          'Акт передачи скутера',
          'Фотофиксация состояния на момент передачи',
          'Копия паспорта арендатора',
        ],
        style: 'body',
        margin: [10, 0, 0, 24],
      },

      // Signatures
      {
        columns: [
          {
            width: '50%',
            stack: [
              { text: 'Арендодатель:', style: 'signLabel' },
              { text: 'ООО "DOKON TEAM"', style: 'body', margin: [0, 4, 0, 16] },
              { text: 'Подпись: _______________', style: 'body' },
            ],
          },
          {
            width: '50%',
            stack: [
              { text: 'Арендатор:', style: 'signLabel' },
              { text: `Ф.И.О: ${courier?.full_name || '_______________________'}`, style: 'body', margin: [0, 4, 0, 8] },
              { text: 'Подпись: _______________', style: 'body' },
            ],
          },
        ],
      },
    ],

    styles: {
      title: { fontSize: 18, bold: true, alignment: 'center' },
      subtitle: { fontSize: 11, alignment: 'left' },
      sectionHeader: { fontSize: 11, bold: true, margin: [0, 0, 0, 6] },
      body: { fontSize: 10, lineHeight: 1.4 },
      signLabel: { fontSize: 10, bold: true },
    },
    defaultStyle: { font: 'Roboto', fontSize: 10 },
    pageMargins: [50, 50, 50, 50],
  }
}

function formatDateLong(dateStr) {
  if (!dateStr) return '___'
  const months = [
    'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
    'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
  ]
  const d = new Date(dateStr + 'T00:00:00')
  return `«${d.getDate()}» ${months[d.getMonth()]} ${d.getFullYear()} года`
}

function fieldRow(label, value) {
  const displayValue = value || ''
  return [
    { text: label, style: 'fieldLabel' },
    {
      text: displayValue || ' ',
      style: 'fieldValue',
      decoration: 'underline',
    },
  ]
}

/**
 * Doverenost (Доверенность) document definition.
 * Matches the official DOKON TEAM power-of-attorney format.
 */
export function doverenostDoc(rental) {
  const { courier, scooter, start_date, end_date, license_no, license_issue_date } = rental

  return {
    content: [
      // Company header
      {
        text: 'ОБЩЕСТВО С ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ',
        style: 'companyName',
      },
      {
        text: '«DOKON TEAM» MCHJ',
        style: 'companyName',
        margin: [0, 0, 0, 16],
      },

      // Title
      { text: 'ДОВЕРЕННОСТЬ', style: 'title', margin: [0, 0, 0, 20] },

      // Opening
      {
        text: 'ООО «DOKON TEAM» доверяет управление и вождение на территории Республики Узбекистан транспортным средством, принадлежащим ООО «DOKON TEAM»:',
        style: 'body',
        margin: [0, 0, 0, 10],
      },

      // Vehicle fields
      {
        table: {
          widths: ['45%', '55%'],
          body: [
            fieldRow('Марка, модель:', scooter?.model),
            fieldRow('Государственный номер:', scooter?.plate),
            fieldRow('Номер кузова (VIN):', scooter?.vin),
            fieldRow('Цвет:', 'Чёрный'),
          ],
        },
        layout: 'noBorders',
        margin: [0, 0, 0, 16],
      },

      // Employee header
      { text: 'Доверенному лицу:', style: 'sectionHeader', margin: [0, 0, 0, 8] },

      // Employee fields
      {
        table: {
          widths: ['45%', '55%'],
          body: [
            fieldRow('Ф.И.О.:', courier?.full_name),
            fieldRow('Паспорт серия / №:', courier?.passport_no),
            fieldRow('Выдан:', [courier?.birth_city, courier?.birth_country].filter(Boolean).join(', ')),
            fieldRow('Адрес проживания:', courier?.address),
            fieldRow('Водительское удостоверение серия / №:', license_no),
            fieldRow('Дата выдачи:', license_issue_date ? formatDate(license_issue_date) : ''),
          ],
        },
        layout: 'noBorders',
        margin: [0, 0, 0, 20],
      },

      // Validity period
      {
        text: [
          { text: 'Настоящая доверенность выдана сроком с ' },
          { text: formatDateLong(start_date), bold: true },
          { text: ' по ' },
          { text: formatDateLong(end_date), bold: true },
          { text: '.' },
        ],
        style: 'body',
        margin: [0, 0, 0, 12],
      },

      // Rights description
      {
        text: 'Доверенность дает право управления, эксплуатации транспортного средства, представления интересов предприятия в органах ГАИ, страховых и иных государственных органах, связанных с использованием данного автомобиля.',
        style: 'body',
        margin: [0, 0, 0, 36],
      },

      // Signatures
      {
        table: {
          widths: ['50%', '50%'],
          body: [
            [
              { text: 'Директор', style: 'signLabel' },
              { text: ' ', style: 'signLabel' },
            ],
            [
              {
                text: [
                  { text: '____________________________' },
                  { text: '  /  ' },
                  { text: '_______________' },
                ],
                style: 'signLine',
                margin: [0, 4, 0, 12],
              },
              { text: ' ' },
            ],
            [
              { text: 'Главный бухгалтер', style: 'signLabel' },
              { text: ' ', style: 'signLabel' },
            ],
            [
              {
                text: [
                  { text: '____________________________' },
                  { text: '  /  ' },
                  { text: '_______________' },
                ],
                style: 'signLine',
                margin: [0, 4, 0, 16],
              },
              { text: ' ' },
            ],
            [
              { text: 'М.П.', style: 'stampLabel' },
              { text: ' ' },
            ],
          ],
        },
        layout: 'noBorders',
      },
    ],

    styles: {
      companyName: { fontSize: 11, bold: true, alignment: 'center' },
      title: { fontSize: 18, bold: true, alignment: 'center' },
      sectionHeader: { fontSize: 11, bold: true },
      body: { fontSize: 11, lineHeight: 1.5 },
      fieldLabel: { fontSize: 10, color: '#444', margin: [0, 3, 8, 3] },
      fieldValue: { fontSize: 10, bold: true, margin: [0, 3, 0, 3] },
      signLabel: { fontSize: 10, bold: true },
      signLine: { fontSize: 10 },
      stampLabel: { fontSize: 10, color: '#666' },
    },
    defaultStyle: { font: 'Roboto', fontSize: 10 },
    pageMargins: [50, 50, 50, 50],
  }
}
