/**
 * pdfmake document definitions for DOKON documents.
 * Both are opened in a new browser tab for printing.
 */

function formatDate(dateStr) {
  if (!dateStr) return '___________'
  const d = new Date(dateStr)
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function checkbox(checked) {
  return checked ? '[x]' : '[ ]'
}

/**
 * Rental Agreement (Договор аренды) document definition.
 */
export function rentalAgreementDoc(rental) {
  const { agreement_no, courier, scooter, tariff, start_date, end_date, license_no, license_issue_date } = rental

  return {
    content: [
      { text: 'ДОГОВОР АРЕНДЫ СКУТЕРА', style: 'title' },
      { text: `№ ${agreement_no}`, style: 'subtitle' },
      { text: `от ${formatDate(start_date)}`, style: 'subtitle', margin: [0, 0, 0, 16] },

      { text: 'СТОРОНЫ ДОГОВОРА', style: 'sectionHeader' },
      {
        table: {
          widths: ['30%', '70%'],
          body: [
            [{ text: 'ФИО арендатора', style: 'label' }, { text: courier?.full_name || '', style: 'value' }],
            [{ text: 'Паспорт', style: 'label' }, { text: courier?.passport_no || '', style: 'value' }],
            [{ text: 'Телефон', style: 'label' }, { text: courier?.phone || '', style: 'value' }],
            [{ text: 'Вод. удостоверение', style: 'label' }, { text: license_no || '', style: 'value' }],
            [{ text: 'Дата выдачи ВУ', style: 'label' }, { text: formatDate(license_issue_date), style: 'value' }],
          ],
        },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 16],
      },

      { text: 'ТРАНСПОРТНОЕ СРЕДСТВО', style: 'sectionHeader' },
      {
        table: {
          widths: ['30%', '70%'],
          body: [
            [{ text: 'Модель', style: 'label' }, { text: scooter?.model || '', style: 'value' }],
            [{ text: 'Гос. номер', style: 'label' }, { text: scooter?.plate || '', style: 'value' }],
            [{ text: 'VIN', style: 'label' }, { text: scooter?.vin || '', style: 'value' }],
          ],
        },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 16],
      },

      { text: 'УСЛОВИЯ АРЕНДЫ', style: 'sectionHeader' },
      {
        table: {
          widths: ['30%', '70%'],
          body: [
            [
              { text: 'Тариф', style: 'label' },
              {
                text: [
                  `${checkbox(tariff === 'daily')} Посуточно  `,
                  `${checkbox(tariff === 'weekly')} Еженедельно  `,
                  `${checkbox(tariff === 'monthly')} Ежемесячно`,
                ],
                style: 'value',
              },
            ],
            [{ text: 'Начало аренды', style: 'label' }, { text: formatDate(start_date), style: 'value' }],
            [{ text: 'Окончание аренды', style: 'label' }, { text: formatDate(end_date), style: 'value' }],
          ],
        },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 32],
      },

      { text: 'ПОДПИСИ', style: 'sectionHeader' },
      {
        columns: [
          {
            width: '50%',
            stack: [
              { text: 'Арендодатель:', style: 'signLabel' },
              { text: '\n\n', },
              { text: '________________________', style: 'signLine' },
              { text: '(подпись / ФИО)', style: 'signHint' },
            ],
          },
          {
            width: '50%',
            stack: [
              { text: 'Арендатор:', style: 'signLabel' },
              { text: '\n\n', },
              { text: '________________________', style: 'signLine' },
              { text: `${courier?.full_name || ''}`, style: 'signHint' },
            ],
          },
        ],
      },
    ],
    styles: {
      title: { fontSize: 16, bold: true, alignment: 'center', margin: [0, 0, 0, 4] },
      subtitle: { fontSize: 12, alignment: 'center', color: '#555' },
      sectionHeader: { fontSize: 11, bold: true, margin: [0, 0, 0, 6], color: '#333', decoration: 'underline' },
      label: { fontSize: 10, color: '#666' },
      value: { fontSize: 10, bold: true },
      signLabel: { fontSize: 10, bold: true, margin: [0, 0, 0, 8] },
      signLine: { fontSize: 10 },
      signHint: { fontSize: 8, color: '#888', margin: [0, 2, 0, 0] },
    },
    defaultStyle: { font: 'Roboto', fontSize: 10 },
    pageMargins: [40, 40, 40, 40],
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
            fieldRow('Выдан:', ''),
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
