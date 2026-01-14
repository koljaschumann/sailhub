/**
 * SEPA XML Generator für Überweisungen
 * Erstellt pain.001.001.03 XML-Dateien für Banküberweisungen
 */

export function generateSEPAXML(payments, creditorInfo) {
  const now = new Date();
  const msgId = `TSC-${now.toISOString().replace(/[-:T.Z]/g, '').slice(0, 14)}`;
  const pmtInfId = `PMT-${msgId}`;
  const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);

  const formatIBAN = (iban) => iban.replace(/\s/g, '').toUpperCase();
  const formatAmount = (amount) => amount.toFixed(2);
  const formatDate = (date) => date.toISOString().slice(0, 10);

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.001.001.03">
  <CstmrCdtTrfInitn>
    <GrpHdr>
      <MsgId>${msgId}</MsgId>
      <CreDtTm>${now.toISOString()}</CreDtTm>
      <NbOfTxs>${payments.length}</NbOfTxs>
      <CtrlSum>${formatAmount(totalAmount)}</CtrlSum>
      <InitgPty>
        <Nm>${creditorInfo.name}</Nm>
      </InitgPty>
    </GrpHdr>
    <PmtInf>
      <PmtInfId>${pmtInfId}</PmtInfId>
      <PmtMtd>TRF</PmtMtd>
      <NbOfTxs>${payments.length}</NbOfTxs>
      <CtrlSum>${formatAmount(totalAmount)}</CtrlSum>
      <PmtTpInf>
        <SvcLvl>
          <Cd>SEPA</Cd>
        </SvcLvl>
      </PmtTpInf>
      <ReqdExctnDt>${formatDate(new Date(now.getTime() + 86400000))}</ReqdExctnDt>
      <Dbtr>
        <Nm>${creditorInfo.name}</Nm>
      </Dbtr>
      <DbtrAcct>
        <Id>
          <IBAN>${formatIBAN(creditorInfo.iban)}</IBAN>
        </Id>
      </DbtrAcct>
      <DbtrAgt>
        <FinInstnId>
          <BIC>${creditorInfo.bic || 'NOTPROVIDED'}</BIC>
        </FinInstnId>
      </DbtrAgt>
      <ChrgBr>SLEV</ChrgBr>`;

  payments.forEach((payment, index) => {
    xml += `
      <CdtTrfTxInf>
        <PmtId>
          <EndToEndId>STARTGELD-${index + 1}</EndToEndId>
        </PmtId>
        <Amt>
          <InstdAmt Ccy="EUR">${formatAmount(payment.amount)}</InstdAmt>
        </Amt>
        <CdtrAgt>
          <FinInstnId>
            <BIC>${payment.bic || 'NOTPROVIDED'}</BIC>
          </FinInstnId>
        </CdtrAgt>
        <Cdtr>
          <Nm>${payment.name}</Nm>
        </Cdtr>
        <CdtrAcct>
          <Id>
            <IBAN>${formatIBAN(payment.iban)}</IBAN>
          </Id>
        </CdtrAcct>
        <RmtInf>
          <Ustrd>${payment.reference}</Ustrd>
        </RmtInf>
      </CdtTrfTxInf>`;
  });

  xml += `
    </PmtInf>
  </CstmrCdtTrfInitn>
</Document>`;

  return xml;
}

export function downloadSEPAXML(payments, creditorInfo, filename = 'sepa-ueberweisung.xml') {
  const xml = generateSEPAXML(payments, creditorInfo);
  const blob = new Blob([xml], { type: 'application/xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
