const express = require('express');
const cors = require('cors')
const bodyParser = require('body-parser');
var fs = require('fs-extra');
var puppeteer = require('puppeteer')
const hbs = require('handlebars');
const path = require('path');


const app = express();
app.use(cors())

app.use(bodyParser.json());
app.use(express.static('public'))
app.listen(3001, () => { console.log('server started') });



app.post('/report/day-report', (req, res) => {
    const record = req.body;
    (async () => {
        var status = await generatePDF(record, 'dayReport');
        const result = {
            status: status,
            url: status ? `http://localhost:3001/reports/day-report/${getDayReportFileName(record.date)}.pdf` : ''
        }
        res.send(result);
    })();
    // asyncCall(record);
    // res.send('done');
})

app.post('/report/customer-report', (req, res) => {
    const record = req.body;
    (async () => {
        var status = await generatePDF(record, 'customerReport');
        const result = {
            status: status,
            url: status ? `http://localhost:3001/reports/customer-report/${record.loanNumber}.pdf` : ''
        }
        res.send(result);
    })();
})


async function generatePDF(data, reportType) {
    try {
        const savePath = reportType === 'dayReport' ? 'reports/day-report' : 'reports/customer-report';
        const fileName = `${reportType === 'dayReport' ? getDayReportFileName(data.date) : data.loanNumber}.pdf`;
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        const content = await fetchTemplate(data, reportType);
        await page.setContent(content);
        await page.emulateMedia('screen');
        await page.pdf({
            path: path.join(process.cwd(), 'public', savePath, fileName),
            format: 'A4',
            printBackground: true
        });
        await browser.close();
        return true;

    } catch (e) {
        console.log('error', e);
        return false;
    }
}

const fetchTemplate = async function (data, reportType) {
    const templateFile = reportType === 'dayReport' ? 'day-report.hbs' : 'customer-report.hbs';
    const filePath = path.join(process.cwd(), 'templates', templateFile);
    const html = await fs.readFile(filePath, 'utf-8');
    return hbs.compile(html)(data);
}

hbs.registerHelper("increment", function (value) {
    return parseInt(value) + 1;
});

const getDayReportFileName = function (dateValue) {
    var date = new Date(dateValue)
    var mm = date.getMonth() + 1;
    var dd = date.getDate();
    return [date.getFullYear(),
    (mm > 9 ? '' : '0') + mm,
    (dd > 9 ? '' : '0') + dd
    ].join('');
}


