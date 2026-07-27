export function getParcels() {
  const data = localStorage.getItem('ba_diaby_parcels');
  return data ? JSON.parse(data) : [];
}

export function addParcel(parcelData) {
  const parcels = getParcels();
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  
  const newParcel = {
    id: Date.now().toString(),
    trackingNumber: `BAD${randomNum}KP`,
    date: new Date().toLocaleDateString('fr-FR'),
    senderName: 'THIIANGUIL MULTI SERVICE',
    senderPhone: '+224611835683',
    ...parcelData
  };

  parcels.unshift(newParcel);
  localStorage.setItem('ba_diaby_parcels', JSON.stringify(parcels));
  return newParcel;
}
