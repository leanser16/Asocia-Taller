import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

const CheckDetailsForm = ({ checkDetails, onCheckDetailsChange, idPrefix = 'chk' }) => {
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        
        if (name === 'checkNumber' && value && !/^\d*$/.test(value)) {
            return; 
        }

        const newDetails = {
            ...checkDetails,
            [name]: type === 'checkbox' ? checked : value,
        };
        onCheckDetailsChange(newDetails);
    };

    return (
        <div className="space-y-4 p-3 border rounded-md mt-2 bg-muted/30">
            <p className="text-sm font-semibold text-primary">Detalles del Cheque</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <Label htmlFor={`${idPrefix}-checkNumber`}>Número</Label>
                    <Input id={`${idPrefix}-checkNumber`} name="checkNumber" type="text" pattern="\d*" value={checkDetails.checkNumber || ''} onChange={handleChange} required />
                </div>
                <div>
                    <Label htmlFor={`${idPrefix}-dueDate`}>Vencimiento</Label>
                    <Input id={`${idPrefix}-dueDate`} name="dueDate" type="date" value={checkDetails.dueDate || ''} onChange={handleChange} required />
                </div>
                <div>
                    <Label htmlFor={`${idPrefix}-bank`}>Banco</Label>
                    <Input id={`${idPrefix}-bank`} name="bank" value={checkDetails.bank || ''} onChange={handleChange} required />
                </div>
            </div>
            <div className="items-top flex space-x-2">
                <Checkbox id={`${idPrefix}-isThirdParty`} name="isThirdParty" checked={checkDetails.isThirdParty || false} onCheckedChange={(checked) => handleChange({ target: { name: 'isThirdParty', type: 'checkbox', checked } })} />
                <div className="grid gap-1.5 leading-none">
                    <label htmlFor={`${idPrefix}-isThirdParty`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        ¿Cheque de tercero?
                    </label>
                </div>
            </div>
            {checkDetails.isThirdParty && (
                <div>
                    <Label htmlFor={`${idPrefix}-thirdPartyName`}>Nombre del Tercero</Label>
                    <Input id={`${idPrefix}-thirdPartyName`} name="thirdPartyName" value={checkDetails.thirdPartyName || ''} onChange={handleChange} required={checkDetails.isThirdParty} />
                </div>
            )}
        </div>
    );
};

export default CheckDetailsForm;