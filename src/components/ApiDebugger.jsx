import React, { useState } from 'react';

const ApiDebugger = () => {
  const [showRawData, setShowRawData] = useState(false);
  const [apiCalls, setApiCalls] = useState([]);
  const [createdObjects, setCreatedObjects] = useState([]);

  const deleteAllObjects = async () => {
    const objectsToDelete = [...createdObjects];
    
    for (const objectName of objectsToDelete) {
      try {
        const response = await fetch(`https://builder.impromptu-labs.com/api_tools/objects/${objectName}`, {
          method: 'DELETE',
          headers: {
            'Authorization': 'Bearer 4e31d5e989125dc49a09d234c59e85bc',
            'X-Generated-App-ID': '501e391c-cef5-462d-abf0-8a3429ff3e27'
          }
        });
        
        if (response.ok) {
          setCreatedObjects(prev => prev.filter(obj => obj !== objectName));
        }
      } catch (error) {
        console.error(`Failed to delete object ${objectName}:`, error);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* API Controls */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          API Debug Controls
        </h3>
        <div className="space-y-3">
          <button
            onClick={() => setShowRawData(!showRawData)}
            className="btn-success w-full"
            aria-label="Toggle raw API data display"
          >
            {showRawData ? 'Hide' : 'Show'} Raw API Data
          </button>
          
          <button
            onClick={deleteAllObjects}
            className="btn-danger w-full"
            aria-label="Delete all created objects"
            disabled={createdObjects.length === 0}
          >
            Delete All Objects ({createdObjects.length})
          </button>
        </div>
      </div>

      {/* API Call History */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Recent API Calls
        </h3>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {apiCalls.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              No API calls yet
            </p>
          ) : (
            apiCalls.map((call) => (
              <div
                key={call.id}
                className={`p-3 rounded-lg border ${
                  call.success
                    ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
                    : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={`font-mono text-sm ${
                    call.success ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'
                  }`}>
                    {call.method} {call.endpoint}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(call.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                
                {showRawData && (
                  <div className="mt-2 space-y-2">
                    <details className="text-xs">
                      <summary className="cursor-pointer text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
                        Request Data
                      </summary>
                      <pre className="mt-1 p-2 bg-gray-100 dark:bg-gray-800 rounded text-gray-800 dark:text-gray-200 overflow-x-auto">
                        {JSON.stringify(call.data, null, 2)}
                      </pre>
                    </details>
                    
                    <details className="text-xs">
                      <summary className="cursor-pointer text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
                        Response Data
                      </summary>
                      <pre className="mt-1 p-2 bg-gray-100 dark:bg-gray-800 rounded text-gray-800 dark:text-gray-200 overflow-x-auto">
                        {JSON.stringify(call.response, null, 2)}
                      </pre>
                    </details>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Game Statistics */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Game Statistics
        </h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
              {apiCalls.filter(call => call.success).length}
            </div>
            <div className="text-gray-600 dark:text-gray-400">
              Successful API Calls
            </div>
          </div>
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {apiCalls.filter(call => !call.success).length}
            </div>
            <div className="text-gray-600 dark:text-gray-400">
              Failed API Calls
            </div>
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          System Status
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">API Endpoint:</span>
            <span className="text-gray-900 dark:text-white font-mono text-xs">
              builder.impromptu-labs.com
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Connection:</span>
            <span className="text-green-600 dark:text-green-400">Active</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Game Mode:</span>
            <span className="text-gray-900 dark:text-white">AI vs Human</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiDebugger;
