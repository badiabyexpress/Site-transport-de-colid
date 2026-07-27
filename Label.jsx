import React from 'react';
import QRCode from 'react-qr-code';
import Barcode from 'react-barcode';

export default function Label({ parcel, onClose }) {
  if (!parcel) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-auto">
      <div className="bg-white p-4 rounded-lg max-w-full">
        {/* Boutons d'action */}
        <div className="flex justify-between mb-4 print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded font-bold"
          >
            Fermer
          </button>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-blue-600 text-white rounded font-bold"
          >
            Imprimer L'étiquette (A6)
          </button>
        </div>

        {/* CONTENEUR ÉTIQUETTE FORMAT A6 (105mm x 148mm) */}
        <div 
          id="printable-label"
          style={{
            width: '105mm',
            height: '148mm',
            boxSizing: 'border-box',
            border: '2px solid #000',
            backgroundColor: '#fff',
            color: '#000',
            fontFamily: 'Arial, sans-serif',
            display: 'flex',
            flexDirection: 'column',
            justify: 'space-between',
            padding: '4mm',
            margin: '0 auto'
          }}
        >
          {/* EN-TÊTE */}
          <div style={{ borderBottom: '2px solid #000', paddingBottom: '3mm', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ fontSize: '18px', fontWeight: '900', margin: 0, lineHeight: '1.1' }}>BA-DIABY<br />EXPRESS</h1>
            </div>
            <div style={{ backgroundColor: '#000', color: '#fff', padding: '4px 12px', borderRadius: '12px', fontWeight: 'bold', fontSize: '12px' }}>
              {parcel.transportType || 'AÉRIEN'}
            </div>
          </div>

          {/* DESTINATAIRE */}
          <div style={{ borderBottom: '2px solid #000', padding: '3mm 0' }}>
            <div style={{ fontSize: '9px', color: '#555', fontWeight: 'bold', marginBottom: '2px' }}>DESTINATAIRE / TO</div>
            <div style={{ fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase' }}>{parcel.recipientName || 'THIIANGUIL MULTI SERVICE'}</div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase' }}>{parcel.address || 'ADRESSE NON RENSEIGNÉE'}</div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase' }}>{(parcel.postalCode || '') + ' ' + (parcel.city || '')}</div>
            <div style={{ fontSize: '12px', fontWeight: 'bold', marginTop: '2px' }}>FRANCE {parcel.recipientPhone || ''}</div>
          </div>

          {/* QR CODE & CODE DE SUIVI */}
          <div style={{ borderBottom: '2px solid #000', padding: '3mm 0', display: 'flex', alignItems: 'center', justifyContent: 'space-around' }}>
            <div style={{ border: '1px solid #000', padding: '2px', backgroundColor: '#fff' }}>
              <QRCode value={parcel.trackingNumber || 'BAD0000'} size={65} />
            </div>
            <div>
              <div style={{ fontSize: '9px', color: '#555', fontWeight: 'bold' }}>CODE DE SUIVI</div>
              <div style={{ fontSize: '16px', fontWeight: '900', letterSpacing: '1px' }}>{parcel.trackingNumber || 'BAD0924KP'}</div>
            </div>
          </div>

          {/* CODE-BARRES */}
          <div style={{ borderBottom: '2px solid #000', padding: '2mm 0', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <Barcode value={parcel.trackingNumber || 'BAD0924KP'} height={25} width={1.2} displayValue={false} margin={0} />
            </div>
            <div style={{ fontSize: '10px', fontWeight: 'bold', letterSpacing: '2px', marginTop: '1px' }}>{parcel.trackingNumber || 'BAD0924KP'}</div>
          </div>

          {/* EXPÉDITEUR */}
          <div style={{ borderBottom: '2px solid #000', padding: '2mm 0', display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '8px', color: '#555', fontWeight: 'bold' }}>EXPÉDITEUR / FROM</div>
              <div style={{ fontSize: '10px', fontWeight: 'bold' }}>{parcel.senderName || 'BA-DIABY EXPRESS'}</div>
            </div>
            <div style={{ fontSize: '10px', fontWeight: 'bold', alignSelf: 'flex-end' }}>
              {parcel.senderPhone || ''}
            </div>
          </div>

          {/* GRILLE INFO (POIDS, ARTICLES, DATE) */}
          <div style={{ borderBottom: '2px solid #000', display: 'flex', textAlign: 'center', fontSize: '9px' }}>
            <div style={{ flex: 1, borderRight: '1px solid #000', padding: '2mm 0' }}>
              <div>POIDS</div>
              <div style={{ fontSize: '12px', fontWeight: 'bold' }}>{parcel.weight ? `${parcel.weight} kg` : '-'}</div>
            </div>
            <div style={{ flex: 1, borderRight: '1px solid #000', padding: '2mm 0' }}>
              <div>ARTICLES</div>
              <div style={{ fontSize: '12px', fontWeight: 'bold' }}>{parcel.itemsCount || 1}</div>
            </div>
            <div style={{ flex: 1, padding: '2mm 0' }}>
              <div>DATE</div>
              <div style={{ fontSize: '11px', fontWeight: 'bold' }}>{parcel.date || new Date().toLocaleDateString('fr-FR')}</div>
            </div>
          </div>

          {/* RÉFÉRENCE */}
          <div style={{ borderBottom: '1px solid #000', padding: '1mm 0', display: 'flex', justifyContent: 'space-between', fontSize: '9px', fontWeight: 'bold' }}>
            <div>RÉF.</div>
            <div>GUINEE → FRANCE</div>
          </div>

          {/* CONDITIONS & FOOTER */}
          <div style={{ fontSize: '6px', textAlign: 'center', color: '#444', padding: '1mm 0' }}>
            Vérifier l'état du colis avant acceptation et émettre toute réserve en présence du livreur.<br />
            Transport soumis aux conditions générales de BA-DIABY EXPRESS.<br />
            Conditions générales : ba-diaby.expedys.com/cgv · Support : famous.hayere@gmail.com
          </div>

          <div style={{ borderTop: '1px solid #000', paddingTop: '1mm', textAlign: 'center', fontSize: '8px', fontWeight: 'bold', letterSpacing: '1px' }}>
            WWW.BA-DIABY.EXPEDYS.COM
          </div>
        </div>
      </div>
    </div>
  );
}
