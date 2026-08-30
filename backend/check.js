require('dotenv').config();
const prisma = require('./lib/prisma');

prisma.order.findUnique({ where: { id: 'cmtfoji31000310xunsvedzls' } })
  .then(o => {
    console.log({
      srOrderId: o.srOrderId,
      srAwbCode: o.srAwbCode,
      srCourierName: o.srCourierName,
      status: o.status,
    });
  })
  .finally(() => prisma.$disconnect());