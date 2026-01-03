import React from 'react';
import { BarChart3 } from 'lucide-react';

const BIDashboard = () => {
  // URL de votre dashboard Power BI - Lien d'embed officiel
  const powerBIUrl = "https://app.powerbi.com/reportEmbed?reportId=4732cdc8-e5d1-4e14-ad48-5253f8a98408&autoAuth=true&ctid=b7bd4715-4217-48c7-919e-2ea97f592fa7";

  return (
    <div className="w-full bg-gray-50">
      <div className="mb-4 p-4 bg-white shadow-sm rounded-lg">
        <h2 className="text-2xl font-bold text-gray-900">Analytics BI</h2>
        <p className="text-gray-600">Dashboard d'analyse des résultats d'examens</p>
        <p className="text-sm text-gray-500 mt-2">
          Visualisez les statistiques, tendances et performances des examens
        </p>
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="w-full" style={{ height: '800px', minHeight: '800px' }}>
          {!powerBIUrl || powerBIUrl.includes('YOUR_REPORT_ID') ? (
            <div className="flex items-center justify-center h-full bg-gray-100">
              <div className="text-center p-8">
                <BarChart3 className="mx-auto text-gray-400 mb-4" size={48} />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  Configuration requise
                </h3>
                <p className="text-gray-600 mb-4">
                  Pour afficher le dashboard Power BI :
                </p>
                <ol className="text-left text-sm text-gray-600 space-y-2 max-w-md mx-auto">
                  <li>1. Publiez votre dashboard sur Power BI Service</li>
                  <li>2. Partagez-le (Partager → Intégrer dans un site web)</li>
                  <li>3. Copiez l'URL fournie</li>
                  <li>4. Remplacez <code className="bg-gray-200 px-1 rounded">YOUR_REPORT_ID</code> dans BIDashboard.jsx</li>
                </ol>
              </div>
            </div>
          ) : (
            <iframe
              src={powerBIUrl}
              width="100%"
              height="100%"
              frameBorder="0"
              allowFullScreen={true}
              title="Power BI Dashboard"
              style={{ border: 'none' }}
            ></iframe>
          )}
        </div>
      </div>
    </div>
  );
};

export default BIDashboard;

