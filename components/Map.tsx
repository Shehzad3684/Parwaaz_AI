import React from 'react';
import { UnitType, MapUnit, Location } from '../types';
import { PoliceIcon, FireIcon, EmsIcon, SwatIcon } from './icons';

interface MapProps {
  callerLocation: Location | null;
  units: MapUnit[];
}

const UnitIcon: React.FC<{ unitType: UnitType, status: 'enroute' | 'onscene' }> = ({ unitType, status }) => {
  const baseClasses = "w-6 h-6 absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-1000 ease-linear";
  const color = status === 'onscene' ? 'text-cad-warn' : 'text-cad-primary';

  switch (unitType) {
    case UnitType.POLICE:
      return <PoliceIcon className={`${baseClasses} ${color}`} />;
    case UnitType.FIRE:
      return <FireIcon className={`${baseClasses} ${color}`} />;
    case UnitType.EMS_BLS:
    case UnitType.EMS_ALS:
      return <EmsIcon className={`${baseClasses} ${color}`} />;
    case UnitType.SWAT:
      return <SwatIcon className={`${baseClasses} ${color}`} />;
    default:
      return null;
  }
};

const Map: React.FC<MapProps> = ({ callerLocation, units }) => {
  return (
    <div className="w-full h-full bg-cad-border border border-cad-text-dim/20 rounded-md relative overflow-hidden">
      {/* Stylized map background */}
      <div className="absolute inset-0 grid grid-cols-10 grid-rows-10">
        {[...Array(100)].map((_, i) => (
          <div key={i} className="border border-cad-text-dim/10"></div>
        ))}
      </div>
       <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/50"></div>


      {/* Caller Location Marker */}
      {callerLocation && (
        <div
          className="absolute transform -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${callerLocation.x}%`, top: `${callerLocation.y}%` }}
        >
          <div className="w-5 h-5 bg-cad-error rounded-full animate-pulse-red shadow-lg shadow-red-500/50 flex items-center justify-center">
             <div className="w-2 h-2 bg-white rounded-full"></div>
          </div>
        </div>
      )}

      {/* Dispatched Units */}
      {units.map(unit => (
        <div
          key={unit.id}
          className="absolute"
          style={{ left: `${unit.x}%`, top: `${unit.y}%` }}
        >
          <UnitIcon unitType={unit.type} status={unit.status} />
        </div>
      ))}
    </div>
  );
};

export default Map;
