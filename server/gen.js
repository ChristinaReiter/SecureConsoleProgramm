import crypto from 'crypto';
import fs from 'fs';
import forge from 'node-forge';

const exports = {};

let attrs = [{
    name: 'commonName',
    value: 'localhost'
}, {
    name: 'countryName',
    value: 'PT'
}, {
    shortName: 'ST',
    value: 'Porto'
}, {
    name: 'localityName',
    value: 'Porto'
}, {
    name: 'organizationName',
    value: 'Porto ESS'
}, {
    shortName: 'OU',
    value: 'Test'
}];


exports.server = () => {
    const pki = forge.pki;
    // generate a keypair and create an X.509v3 certificate
    let keys = pki.rsa.generateKeyPair(2048);
    let cert = pki.createCertificate();
    cert.publicKey = keys.publicKey;
    // console.log(keys)

    // NOTE: serialNumber is the hex encoded value of an ASN.1 INTEGER.
    // Conforming CAs should ensure serialNumber is:
    // - no more than 20 octets
    // - non-negative (prefix a '00' if your value starts with a '1' bit)
    cert.serialNumber = '01' + crypto.randomBytes(19).toString("hex"); // 1 octet = 8 bits = 1 byte = 2 hex chars
    cert.validity.notBefore = new Date();
    cert.validity.notAfter = new Date();
    cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1); // adding 1 year of validity from now
    cert.setSubject(attrs);
    cert.setIssuer(attrs);
    cert.setExtensions([{
        name: 'basicConstraints',
        cA: true
    }, {
        name: 'keyUsage',
        keyCertSign: true,
        digitalSignature: true,
        nonRepudiation: true,
        keyEncipherment: true,
        dataEncipherment: true
    }, {
        name: 'extKeyUsage',
        serverAuth: true,
        clientAuth: true,
        codeSigning: true,
        emailProtection: true,
        timeStamping: true
    }, {
        name: 'nsCertType',
        client: true,
        server: true,
        email: true,
        objsign: true,
        sslCA: true,
        emailCA: true,
        objCA: true
    }, {
        name: 'subjectAltName',
        altNames: [{
            type: 6, // URI
            value: 'https://localhost:3000/'
        }, {
            type: 7, // IP
            ip: '127.0.0.1'
        }]
    }, {
        name: 'subjectKeyIdentifier'
    }]);

    // self-sign certificate
    cert.sign(keys.privateKey);

    // convert a Forge certificate to PEM
    let pem = pki.certificateToPem(cert);

    // console.log();
    // console.log(pem); // <-- This is what you want!
    // console.log();

    // write it to a file
    let fname = './cert/cert_server.pem'
    fs.writeFileSync(fname, pem);
    let fname2 = './cert/key_server.pem'
    fs.writeFileSync(fname2, pki.privateKeyToPem(keys.privateKey));
}

exports.client = (_id) => {
    const pki = forge.pki;
    const csr = pki.createCertificationRequest();
    let keys = pki.rsa.generateKeyPair(2048);
    csr.publicKey = keys.publicKey;
    csr.setSubject([{
        name: 'commonName',
        value: '' + _id
    }, {
        name: 'countryName',
        value: 'US'
    }, {
        shortName: 'ST',
        value: 'Virginia'
    }, {
        name: 'localityName',
        value: 'Blacksburg'
    }, {
        name: 'organizationName',
        value: 'Test'
    }, {
        shortName: 'OU',
        value: 'Test'
    }]);
    csr.sign(keys.privateKey);

    // convert a Forge certificate to PEM
    let pem = pki.certificationRequestToPem(csr);
    // Save the CSR to disk
    let fname = './cert/csr_client_' + _id + '.pem'
    fs.writeFileSync(fname, pem);

    let cert = pki.createCertificate();
    cert.publicKey = csr.publicKey;
    cert.serialNumber = '01' + crypto.randomBytes(19).toString("hex"); // 1 octet = 8 bits = 1 byte = 2 hex chars
    cert.validity.notBefore = new Date();
    cert.validity.notAfter = new Date();
    cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1); // adding 1 year of validity from now
    cert.setIssuer(attrs);
    cert.setSubject([{
        name: 'commonName',
        value: '' + _id
    }]);
    cert.setExtensions([{
        name: 'basicConstraints',
        cA: true
    }, {
        name: 'keyUsage',
        keyCertSign: true,
        digitalSignature: true,
        nonRepudiation: true,
        keyEncipherment: true,
        dataEncipherment: true
    }, {
        name: 'extKeyUsage',
        serverAuth: true,
        clientAuth: true,
        codeSigning: true,
        emailProtection: true,
        timeStamping: true
    }, {
        name: 'nsCertType',
        client: true,
        server: true,
        email: true,
        objsign: true,
        sslCA: true,
        emailCA: true,
        objCA: true
    }, {
        name: 'subjectAltName',
        altNames: [{
            type: 6, // URI
            value: '' + _id
        }, {
            type: 7, // IP
            ip: '127.0.0.1'
        }]
    }, {
        name: 'subjectKeyIdentifier'
    }]);
    const serverKey = fs.readFileSync('./cert/key_server.pem');
    cert.sign(pki.privateKeyFromPem(serverKey));

    // convert a Forge certificate to PEM
    pem = pki.certificateToPem(cert);
    // Save the certificate to disk
    let fname2 = './cert/cert_client_' + _id + '.pem'
    fs.writeFileSync(fname2, pem);
    let fname3 = './cert/key_client_' + _id + '.pem'
    fs.writeFileSync(fname3, pki.privateKeyToPem(keys.privateKey));
    console.log('Certificate created for ' + _id);
    return { key: pki.privateKeyToPem(keys.privateKey), cert: pem }
}


export default exports;