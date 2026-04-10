import React, { useState } from 'react';
import { Product, UserRole } from '../types';

interface ReceivingProps {
  products: Product[];
  onUpdateFactoryReserve: (data: {
    productId: string;
    quantity: number;
    date: string;
    notes?: string;
  }) => Promise<void>;
  userRole: UserRole;
  canCreate: boolean;
}

const Receiving: React.FC<ReceivingProps> = ({
  products,
  onUpdateFactoryReserve,
  canCreate
}) => {
  const [formData, setFormData] = useState({
    productId: 'prod-bags',
    quantity: 0,
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreate) return;
    if (formData.quantity <= 0) return;

    await onUpdateFactoryReserve({
      productId: formData.productId,
      quantity: Number(formData.quantity),
      date: formData.date,
      notes: formData.notes
    });

    setFormData({
      productId: 'prod-bags',
      quantity: 0,
      date: new Date().toISOString().split('T')[0],
      notes: ''
    });

    alert('Factory reserve updated successfully.');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">

        <div className="bg-[#003366] p-8 text-white">
          <h2 className="text-2xl font-black uppercase">
            Packing Bags Factory Reserve Update
          </h2>
          <p className="text-green-400 text-xs mt-2 uppercase tracking-widest">
            End of day production intake only
          </p>
        </div>

        {canCreate ? (
          <form onSubmit={handleSubmit} className="p-8 space-y-6">

            <div>
              <label className="text-xs font-bold uppercase text-gray-400">
                Date
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                className="w-full p-4 border rounded-xl"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase text-gray-400">
                Packing Bags Produced (Factory Reserve)
              </label>
              <input
                type="number"
                min="0"
                value={formData.quantity || ''}
                onChange={(e) =>
                  setFormData({ ...formData, quantity: Number(e.target.value) })
                }
                className="w-full p-4 border rounded-xl text-2xl font-black"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase text-gray-400">
                Notes
              </label>
              <input
                type="text"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                className="w-full p-4 border rounded-xl"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#003366] text-white py-5 rounded-2xl font-black uppercase"
            >
              Update Factory Reserve
            </button>

          </form>
        ) : (
          <div className="p-8 text-amber-600 font-bold">
            Read-only access
          </div>
        )}
      </div>
    </div>
  );
};

export default Receiving;