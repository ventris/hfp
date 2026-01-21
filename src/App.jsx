import { useEffect, useRef, useState } from 'react';
import './App.css';

// Browser-specific CSS features with minimum version requirements
// These features help detect if the claimed User-Agent matches actual browser capabilities
const browserFeatures = {
  chrome: [
    // https://caniuse.com/css-text-box-trim
    { feature: 'text-box-trim: trim-start', minVersion: 133 },
  ],
  firefox: [
    { feature: 'text-wrap: balance', minVersion: 121 },
  ],
};

function detectBrowserFromUA(ua) {
  if (/Chrome\/(\d+)/.test(ua)) {
    return { browser: 'chrome', version: parseInt(RegExp.$1, 10) };
  }
  if (/Firefox\/(\d+)/.test(ua)) {
    return { browser: 'firefox', version: parseInt(RegExp.$1, 10) };
  }
  return { browser: 'unknown', version: 0 };
}

function validateUserAgent(ua) {
  const { browser, version } = detectBrowserFromUA(ua);

  if (browser === 'unknown') {
    return { browser, claimedVersion: version, valid: null, mismatches: [], reason: 'unknown browser' };
  }

  const features = browserFeatures[browser] || [];
  const mismatches = [];

  for (const { feature, minVersion } of features) {
    const shouldSupport = version >= minVersion;
    const actuallySupports = CSS.supports(feature);

    // If UA claims a version that should support the feature, but it doesn't
    if (shouldSupport && !actuallySupports) {
      mismatches.push({ feature, minVersion, expected: true, actual: false });
    }
  }

  return {
    browser,
    claimedVersion: version,
    valid: mismatches.length === 0,
    mismatches,
  };
}

const initialDimensions = () => {
  if (typeof window === 'undefined') {
    return { width: 0, height: 0 };
  }

  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
};

export default function App() {
  const [dimensions, setDimensions] = useState(initialDimensions);
  const [userAgent, setUserAgent] = useState(() =>
    typeof navigator === 'undefined' ? 'Unavailable' : navigator.userAgent,
  );
  const hasReported = useRef(false);
  const [cssFingerprint, setCssFingerprint] = useState('');
  const [webdriver, _] = useState(navigator.webdriver);
  const [uaValidation, setUaValidation] = useState(null);

  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);

    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      setUserAgent(navigator.userAgent);
    }
  }, []);

  useEffect(() => {
    if (hasReported.current) {
      return;
    }

    if (!dimensions.width || !dimensions.height) {
      return;
    }

    if (import.meta.env.DEV) {
      hasReported.current = true;
      return;
    }

    hasReported.current = true;

    // General CSS fingerprint - creates a binary string of supported features
    const cssFeatures = [
      'display: grid',
      'display: flex',
      'backdrop-filter: blur(1px)',
      'position: sticky',
      'gap: 1px',
      'aspect-ratio: 1',
      'container-type: inline-size',
      'color: oklch(0 0 0)',
      'accent-color: red',
      'text-wrap: balance',
      'view-transition-name: x',
    ];

    const fingerprintValue = cssFeatures.map(f => CSS.supports(f) ? '1' : '0').join('');
    setCssFingerprint(fingerprintValue);

    // Validate User-Agent against actual CSS support
    // If UA claims a version that should support certain features but doesn't, it's likely spoofed
    const validation = validateUserAgent(userAgent);
    setUaValidation(validation);

    fetch('/api/visit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        width: dimensions.width,
        height: dimensions.height,
        userAgent,
        cssFingerprint: fingerprintValue,
        webDriver: webdriver,
        uaValidation: validation,
      }),
    })
      .catch((error) => {
        if (import.meta.env.DEV) {
          console.warn('Failed to report visit', error);
        }
      });
  }, [dimensions.width, dimensions.height, userAgent, webdriver]);

  return (
    <div className="fingerprint-container">
      <h2>User Information</h2>
      <table className="fingerprint-table">
        <thead>
          <tr>
            <th>Key</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>window.width</td>
            <td>{dimensions.width}px</td>
          </tr>
          <tr>
            <td>window.height</td>
            <td>{dimensions.height}px</td>
          </tr>
          <tr>
            <td>navigator.userAgent</td>
            <td>{userAgent}</td>
          </tr>
          <tr>
            <td>CSS Fingerprint</td>
            <td>{cssFingerprint}</td>
          </tr>
          <tr>
            <td>navigator.webdriver</td>
            <td>{String(navigator.webdriver)}</td>
          </tr>
          <tr>
            <td>Detected Browser</td>
            <td>{uaValidation ? `${uaValidation.browser} v${uaValidation.claimedVersion}` : 'Analyzing...'}</td>
          </tr>
          <tr>
            <td>UA Validation</td>
            <td style={{ color: uaValidation?.valid === false ? 'red' : uaValidation?.valid === true ? 'green' : 'gray' }}>
              {uaValidation?.valid === null ? 'Unknown browser' : uaValidation?.valid ? 'Valid' : `Spoofed (${uaValidation?.mismatches?.length} mismatches)`}
            </td>
          </tr>
          {uaValidation?.mismatches?.length > 0 && (
            <tr>
              <td>Mismatched Features</td>
              <td style={{ color: 'red', fontSize: '0.85em' }}>
                {uaValidation.mismatches.map(m => m.feature).join(', ')}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
