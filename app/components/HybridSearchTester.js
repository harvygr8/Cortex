'use client';

import { useState } from 'react';
import useThemeStore from '../../lib/stores/themeStore';

export default function HybridSearchTester({ projectId, projectTitle }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [weights, setWeights] = useState({ semantic: 0.7, keyword: 0.3 });
  const { isDarkMode, colors } = useThemeStore();
  const theme = isDarkMode ? colors.dark : colors.light;

  const handleTestSearch = async () => {
    if (!query.trim()) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/test-hybrid-search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, weights })
      });

      if (!response.ok) {
        throw new Error('Search test failed');
      }

      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Error testing hybrid search:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWeightChange = (type, value) => {
    const newWeights = { ...weights, [type]: parseFloat(value) };
    // Ensure weights sum to 1
    const otherType = type === 'semantic' ? 'keyword' : 'semantic';
    newWeights[otherType] = 1 - newWeights[type];
    setWeights(newWeights);
  };

  return (
    <div className={`p-4 rounded-lg ${theme.card} border ${theme.border}`}>
      <h3 className={`text-lg font-semibold font-source-sans-3 mb-4 ${theme.text}`}>
        🚀 Hybrid Search Tester
      </h3>
      
      <div className="space-y-4">
        {/* Search Query */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${theme.text}`}>
            Test Query:
          </label>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter a search query to test..."
            className={`w-full p-2 rounded border ${theme.input} ${theme.text}`}
          />
        </div>

        {/* Weight Controls */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${theme.text}`}>
              Semantic Weight: {weights.semantic}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={weights.semantic}
              onChange={(e) => handleWeightChange('semantic', e.target.value)}
              className="w-full"
            />
          </div>
          <div>
            <label className={`block text-sm font-medium mb-2 ${theme.text}`}>
              Keyword Weight: {weights.keyword}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={weights.keyword}
              onChange={(e) => handleWeightChange('keyword', e.target.value)}
              className="w-full"
            />
          </div>
        </div>

        {/* Test Button */}
        <button
          onClick={handleTestSearch}
          disabled={isLoading || !query.trim()}
          className={`px-4 py-2 rounded ${theme.button} hover:opacity-80 transition-opacity disabled:opacity-50`}
        >
          {isLoading ? 'Testing...' : 'Test Hybrid Search'}
        </button>

        {/* Force Reinitialize Button */}
        <button
          onClick={async () => {
            try {
              const response = await fetch(`/api/projects/${projectId}/vectors`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'reinitialize-hybrid' })
              });
              
              if (response.ok) {
                const data = await response.json();
                console.log('Hybrid retriever reinitialized:', data);
                alert('Hybrid retriever reinitialized successfully!');
              } else {
                const error = await response.json();
                console.error('Failed to reinitialize:', error);
                alert('Failed to reinitialize hybrid retriever');
              }
            } catch (error) {
              console.error('Error reinitializing:', error);
              alert('Error reinitializing hybrid retriever');
            }
          }}
          className={`px-4 py-2 rounded ${theme.secondary} hover:opacity-80 transition-opacity ml-2`}
          title="Force reinitialize the hybrid retriever if BM25 is not working"
        >
          🔄 Reinitialize Hybrid
        </button>

        {/* Results */}
        {results && (
          <div className="mt-6 space-y-4">
            <h4 className={`text-md font-semibold font-source-sans-3 ${theme.text}`}>
              Search Results Comparison
            </h4>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Hybrid Results */}
              <div className={`p-3 rounded border ${theme.border}`}>
                <h5 className={`font-medium mb-2 ${theme.text}`}>
                  🔗 Hybrid Search Results ({results.hybridResults.length})
                </h5>
                <div className="space-y-2">
                  {results.hybridResults.map((result, index) => (
                    <div key={index} className={`p-2 rounded text-sm ${theme.card}`}>
                      <div className="font-medium">{result.pageTitle}</div>
                      <div className="text-xs opacity-70">
                        Score: {result.score} | Source: {result.source}
                      </div>
                      <div className="text-xs mt-1 opacity-60">
                        {result.content}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Semantic Results */}
              <div className={`p-3 rounded border ${theme.border}`}>
                <h5 className={`font-medium mb-2 ${theme.text}`}>
                  🧠 Semantic Search Results ({results.semanticResults.length})
                </h5>
                <div className="space-y-2">
                  {results.semanticResults.map((result, index) => (
                    <div key={index} className={`p-2 rounded text-sm ${theme.card}`}>
                      <div className="font-medium">{result.pageTitle}</div>
                      <div className="text-xs opacity-70">
                        Rank: {result.rank}
                      </div>
                      <div className="text-xs mt-1 opacity-60">
                        {result.content}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className={`p-3 rounded ${theme.card} border ${theme.border}`}>
              <h5 className={`font-medium mb-2 ${theme.text}`}>Summary</h5>
              <div className="text-sm space-y-1">
                <div>Query: "{results.query}"</div>
                <div>Weights: Semantic {weights.semantic}, Keyword {weights.keyword}</div>
                <div>Hybrid Results: {results.summary.hybridCount}</div>
                <div>Semantic Results: {results.summary.semanticCount}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
