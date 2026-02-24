"""
End-to-End Integration Test
测试所有服务之间的完整链路
"""

import urllib.request
import json
import sys

PASS = 0
FAIL = 0


def test(name, url, method='GET', body=None):
    global PASS, FAIL
    try:
        req = urllib.request.Request(url, method=method)
        if body:
            req.add_header('Content-Type', 'application/json')
            req.data = json.dumps(body).encode()
        resp = urllib.request.urlopen(req, timeout=15)
        data = json.loads(resp.read())
        print(f'  [PASS] {name}')
        PASS += 1
        return data
    except Exception as e:
        print(f'  [FAIL] {name}: {e}')
        FAIL += 1
        return None


def main():
    print('=' * 55)
    print('  JiuCai AI - End-to-End Integration Tests')
    print('=' * 55)

    # 1. Node.js API Server
    print('\n--- 1. Node.js API Server (port 3001) ---')
    test('Health check', 'http://localhost:3001/api/health')

    # 2. ML Inference Service
    print('\n--- 2. ML Inference Service (port 8002) ---')
    h = test('ML Health (direct)', 'http://localhost:8002/health')
    if h:
        print(f'       Mode: {h.get("model_version", "?")}')

    # 3. ML Proxy via Node.js
    print('\n--- 3. ML Proxy via Node.js ---')
    test('ML Health (proxy)', 'http://localhost:3001/api/ml/health')

    # 4. ML Analyze Endpoint
    print('\n--- 4. ML Analyze Endpoint ---')
    r = test('Analyze 600519', 'http://localhost:8002/analyze', 'POST',
             {'symbol': '600519', 'analysis_type': 'comprehensive'})
    if r and r.get('success'):
        tech = r['results'].get('technical', {})
        risk = r['results'].get('risk', {})
        regime = r['results'].get('market_regime', {})
        macd = tech.get('MACD', {})
        rsi = tech.get('RSI_14', {})
        print(f'       MACD: {macd.get("macd", "?")} ({macd.get("interpretation", "?")})')
        print(f'       RSI(14): {rsi.get("value", "?")} ({rsi.get("interpretation", "?")})')
        print(f'       Sharpe: {risk.get("sharpe_ratio", "?")} | VaR95: {risk.get("VaR_95", "?")}%')
        print(f'       MaxDD: {risk.get("max_drawdown", "?")}% | Vol: {risk.get("annual_volatility", "?")}%')
        print(f'       Regime: {regime.get("label", "?")}')

    # 5. ML Predict Endpoint
    print('\n--- 5. ML Predict Endpoint ---')
    p = test('Predict 000001 (5d)', 'http://localhost:8002/predict', 'POST',
             {'symbol': '000001', 'horizon': 5, 'include_uncertainty': True})
    if p and p.get('success'):
        mi = p.get('model_info', {})
        print(f'       Model: {mi.get("model_type", "?")} | Method: {mi.get("uncertainty_method", "?")}')
        for pred in p.get('predictions', []):
            print(f'       {pred["target_date"]}: ¥{pred["predicted_price"]} '
                  f'[{pred["confidence_lower"]}~{pred["confidence_upper"]}] '
                  f'±{pred["uncertainty"]}')

    # 6. Backtest API
    print('\n--- 6. Backtest API ---')
    bt = test('Backtest MA 000001', 'http://localhost:3001/api/backtest', 'POST',
              {'symbol': '000001', 'strategy': 'ma',
               'startDate': '2024-01-01', 'endDate': '2024-06-30',
               'initialCapital': 100000})
    if bt and bt.get('success'):
        d = bt['data']
        ret = d.get('returns', {})
        rsk = d.get('risk', {})
        trd = d.get('trading', {})
        print(f'       Total Return: {ret.get("total_return_pct", "?")}%')
        print(f'       Annual Return: {ret.get("annual_return_pct", "?")}%')
        print(f'       Sharpe: {rsk.get("sharpe_ratio", "?")}')
        print(f'       MaxDD: {rsk.get("max_drawdown_pct", "?")}%')
        print(f'       Total Trades: {trd.get("total_trades", "?")}')

    # 7. ML Analyze via Proxy
    print('\n--- 7. ML Analyze via Proxy ---')
    rp = test('Analyze proxy 000001 (risk)', 'http://localhost:3001/api/ml/analyze', 'POST',
              {'symbol': '000001', 'analysis_type': 'risk'})
    if rp and rp.get('success'):
        rr = rp['results'].get('risk', {})
        print(f'       Sortino: {rr.get("sortino_ratio", "?")}')
        print(f'       CVaR95: {rr.get("CVaR_95", "?")}%')

    # 8. ML Predict via Proxy
    print('\n--- 8. ML Predict via Proxy ---')
    pp = test('Predict proxy 600519 (3d)', 'http://localhost:3001/api/ml/predict', 'POST',
              {'symbol': '600519', 'horizon': 3, 'include_uncertainty': True})
    if pp and pp.get('success'):
        for pred in pp.get('predictions', []):
            print(f'       {pred["target_date"]}: ¥{pred["predicted_price"]}')

    # Summary
    print('\n' + '=' * 55)
    total = PASS + FAIL
    print(f'  Results: {PASS}/{total} passed, {FAIL} failed')
    if FAIL == 0:
        print('  ✅ All integration tests PASSED!')
    else:
        print('  ⚠️ Some tests failed - check service status')
    print('=' * 55)

    return 0 if FAIL == 0 else 1


if __name__ == '__main__':
    sys.exit(main())
