import React, { useState, useEffect } from 'react';
import { Package, Plus, Search, Printer, MapPin } from 'lucide-react';
import { getParcels, addParcel } from './storage.js';
import Label from './Label.jsx';

export default function App() {
  const [parcels, setParcels] = useState([]);
  const [selectedParcel, setSelectedParcel] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Formulaire d'ajout
  const [formData, setFormData] = useState({
    recipientName: '',
    recipientPhone: '',
    address: '',
    postalCode: '',
    city: '',
    weight: '',
    itemsCount: '1',
    transportType: 'AÉRIEN'
  });

  useEffect(() => {
    setParcels(getParcels());
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.recipientName) return;

    const newParcel = addParcel(formData);
    setParcels(getParcels());
    setFormData({
      recipientName: '',
      recipientPhone: '',
      address: '',
      postalCode: '',
      city: '',
      weight: '',
      itemsCount: '1',
      transportType: 'AÉRIEN'
    });
  };

  const filteredParcels = parcels.filter(p => 
    p.trackingNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.recipientName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <header className="max-w-4xl mx-auto bg-white p-4 rounded-lg shadow mb-6 flex justify-between items-center">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Package className="text-blue-600" /> BA-DIABY EXPRESS
        </h1>
      </header>

      <main className="max-w-4xl mx-auto grid gap-6 md:grid-cols-2">
        {/* FORMULAIRE */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Plus size={20} /> Nouveau Colis
          </h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600">Nom Destinataire</label>
              <input
                type="text"
                required
                className="w-full p-2 border rounded text-sm"
                value={formData.recipientName}
                onChange={e => setFormData({...formData, recipientName: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600">Téléphone</label>
              <input
                type="text"
                className="w-full p-2 border rounded text-sm"
                value={formData.recipientPhone}
                onChange={e => setFormData({...formData, recipientPhone: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 flex items-center gap-1">
                <MapPin size={12} /> Adresse Complète
              </label>
              <input
                type="text"
                placeholder="N° et Nom de rue"
                className="w-full p-2 border rounded text-sm mb-2"
                value={formData.address}
                onChange={e => setFormData({...formData, address: e.target.value})}
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Code Postal"
                  className="p-2 border rounded text-sm"
                  value={formData.postalCode}
                  onChange={e => setFormData({...formData, postalCode: e.target.value})}
                />
                <input
                  type="text"
                  placeholder="Ville"
                  className="p-2 border rounded text-sm"
                  value={formData.city}
                  onChange={e => setFormData({...formData, city: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs font-semibold text-gray-600">Poids (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  className="w-full p-2 border rounded text-sm"
                  value={formData.weight}
                  onChange={e => setFormData({...formData, weight: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600">Articles</label>
                <input
                  type="number"
                  className="w-full p-2 border rounded text-sm"
                  value={formData.itemsCount}
                  onChange={e => setFormData({...formData, itemsCount: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600">Transport</label>
                <select
                  className="w-full p-2 border rounded text-sm"
                  value={formData.transportType}
                  onChange={e => setFormData({...formData, transportType: e.target.value})}
                >
                  <option value="AÉRIEN">AÉRIEN</option>
                  <option value="MARITIME">MARITIME</option>
                </select>
              </div>
            </div>

            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700">
              Enregistrer Colis
            </button>
          </form>
        </div>

        {/* LISTE DES COLIS */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-bold mb-4">Liste des Colis</h2>
          <div className="relative mb-4">
            <Search className="absolute left-2 top-2.5 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Rechercher nom ou code..."
              className="w-full pl-8 p-2 border rounded text-sm"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="space-y-3 max-h-96 overflow-auto">
            {filteredParcels.map(parcel => (
              <div key={parcel.id} className="p-3 border rounded flex justify-between items-center bg-gray-50">
                <div>
                  <div className="font-bold text-sm">{parcel.recipientName}</div>
                  <div className="text-xs text-gray-500">{parcel.trackingNumber} · {parcel.weight || 0} kg</div>
                  {parcel.address && (
                    <div className="text-xs text-gray-400">{parcel.address}, {parcel.city}</div>
                  )}
                </div>
                <button
                  onClick={() => setSelectedParcel(parcel)}
                  className="p-2 bg-green-600 text-white rounded flex items-center gap-1 text-xs font-bold hover:bg-green-700"
                >
                  <Printer size={14} /> Étiquette
                </button>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* POPUP ETIQUETTE */}
      {selectedParcel && (
        <Label parcel={selectedParcel} onClose={() => setSelectedParcel(null)} />
      )}
    </div>
  );
}
