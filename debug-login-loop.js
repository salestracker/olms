// Debug script for login loop issue
const logCounters = {};
let prevFetchCount = 0;
let prevAnalyticsCount = 0;
let renderCount = 0;
let fetchSequence = [];

// Override console.log to add tracking
const originalConsoleLog = console.log;
console.log = function(...args) {
  // Count occurrences of each log message
  const message = args.join(' ');
  logCounters[message] = (logCounters[message] || 0) + 1;
  
  // Track fetch sequence for important operations
  if (message.includes('Fetching data for role:') || 
      message.includes('Fetching all orders') ||
      message.includes('Fetching analytics data')) {
    fetchSequence.push({
      time: new Date().toISOString(),
      message: message
    });
  }
  
  // Track component lifecycle events
  if (message.includes('Dashboard component mounted') || 
      message.includes('Dashboard component unmounted') ||
      message.includes('App component mounted') ||
      message.includes('App component unmounting')) {
    renderCount++;
    fetchSequence.push({
      time: new Date().toISOString(),
      message: `[LIFECYCLE] ${message}`
    });
  }
  
  // Print original log with counter
  const count = logCounters[message];
  if (count > 1) {
    originalConsoleLog.apply(console, [...args, `(${count}x)`]);
  } else {
    originalConsoleLog.apply(console, args);
  }
  
  // Periodically analyze fetch pattern
  if (message.includes('Fetched') && message.includes('orders')) {
    const orderFetchCount = Object.keys(logCounters)
      .filter(key => key.includes('Fetching all orders'))
      .reduce((sum, key) => sum + logCounters[key], 0);
      
    const analyticsFetchCount = Object.keys(logCounters)
      .filter(key => key.includes('Fetching analytics data'))
      .reduce((sum, key) => sum + logCounters[key], 0);
    
    // Only report when counts change
    if (orderFetchCount !== prevFetchCount || analyticsFetchCount !== prevAnalyticsCount) {
      originalConsoleLog.apply(console, [
        '\n[DIAGNOSTICS]',
        `Order fetch count: ${orderFetchCount}`,
        `Analytics fetch count: ${analyticsFetchCount}`,
        `Component renders: ${renderCount}`,
        '\n'
      ]);
      
      // If we've had more than 3 fetch cycles, show the last 6 fetch operations
      if (fetchSequence.length > 6) {
        originalConsoleLog.apply(console, ['[RECENT FETCH SEQUENCE]']);
        fetchSequence.slice(-6).forEach(entry => {
          originalConsoleLog.apply(console, [`${entry.time} - ${entry.message}`]);
        });
        originalConsoleLog.apply(console, ['\n']);
      }
      
      prevFetchCount = orderFetchCount;
      prevAnalyticsCount = analyticsFetchCount;
    }
  }
};

// Add a global debugger function
window.zenithDebug = {
  getFetchStats: () => {
    return {
      fetchCounts: Object.entries(logCounters)
        .filter(([key]) => key.includes('Fetch'))
        .reduce((obj, [key, value]) => {
          obj[key] = value;
          return obj;
        }, {}),
      renderCount,
      fetchSequence,
      tokensVerified: logCounters['Auth token exists in localStorage: true'] || 0
    };
  },
  
  getComponentStats: () => {
    return {
      mounted: {
        dashboard: logCounters['Dashboard component mounted'] || 0,
        app: logCounters['App component mounted'] || 0
      },
      unmounted: {
        dashboard: logCounters['Dashboard component unmounted'] || 0,
        app: logCounters['App component unmounting'] || 0
      }
    };
  },
  
  clearStats: () => {
    Object.keys(logCounters).forEach(key => delete logCounters[key]);
    fetchSequence = [];
    renderCount = 0;
    prevFetchCount = 0;
    prevAnalyticsCount = 0;
    console.log('Debug stats cleared');
  }
};

console.log('[DEBUG] Login loop diagnostics script loaded');
