/**
 * SENEC-Style Anlagen-Visualisierung V3
 * ======================================
 * Isometrische 3D-Perspektive mit professionellem Design
 */

import { useState } from "react";
import "./AnlageVisualisierung.css";

interface AnlageVisualisierungProps {
  totalKwp?: number;
  speicherKwh?: number;
  wallboxKw?: number;
  waermepumpeKw?: number;
  wechselrichterKw?: number;
  messkonzept?: string;
}

export function AnlageVisualisierung({
  totalKwp = 0,
  speicherKwh = 0,
  wallboxKw = 0,
  waermepumpeKw = 0,
  wechselrichterKw = 0,
  messkonzept,
}: AnlageVisualisierungProps) {
  const [activeComponent, setActiveComponent] = useState<string | null>(null);

  const hasPV = totalKwp > 0;
  const hasBattery = speicherKwh > 0;
  const hasWallbox = wallboxKw > 0;
  const hasHeatpump = waermepumpeKw > 0;
  const displayInverterKw = wechselrichterKw > 0 ? wechselrichterKw : (totalKwp * 0.9);

  return (
    <div className="senec-viz">
      {/* Background with gradient */}
      <div className="senec-viz__bg">
        <div className="senec-viz__gradient" />
        <div className="senec-viz__grid" />
      </div>

      {/* Sun */}
      {hasPV && (
        <div className="senec-sun">
          <div className="senec-sun__glow" />
          <div className="senec-sun__core" />
          <div className="senec-sun__rays">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="senec-sun__ray" style={{ transform: `rotate(${i * 30}deg)` }} />
            ))}
          </div>
        </div>
      )}

      {/* Main Scene */}
      <div className="senec-scene">
        {/* Isometric House */}
        <div className="senec-house">
          {/* House Shadow */}
          <div className="senec-house__shadow" />

          {/* House Base/Foundation */}
          <div className="senec-house__foundation">
            <div className="senec-house__foundation-front" />
            <div className="senec-house__foundation-side" />
          </div>

          {/* House Body */}
          <div className="senec-house__body">
            <div className="senec-house__wall senec-house__wall--front">
              {/* Windows */}
              <div className="senec-house__window senec-house__window--1">
                <div className="senec-house__window-glow" />
              </div>
              <div className="senec-house__window senec-house__window--2">
                <div className="senec-house__window-glow" />
              </div>
              {/* Door */}
              <div className="senec-house__door">
                <div className="senec-house__door-handle" />
              </div>
            </div>
            <div className="senec-house__wall senec-house__wall--side">
              <div className="senec-house__window senec-house__window--3">
                <div className="senec-house__window-glow" />
              </div>
            </div>
          </div>

          {/* Roof */}
          <div className="senec-house__roof">
            <div className="senec-house__roof-front" />
            <div className="senec-house__roof-side" />
            <div className="senec-house__roof-top" />

            {/* Solar Panels */}
            {hasPV && (
              <div className="senec-solar">
                <div className="senec-solar__panel-row">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="senec-solar__panel">
                      <div className="senec-solar__cell" />
                      <div className="senec-solar__cell" />
                      <div className="senec-solar__cell" />
                      <div className="senec-solar__shimmer" />
                    </div>
                  ))}
                </div>
                <div className="senec-solar__panel-row">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="senec-solar__panel">
                      <div className="senec-solar__cell" />
                      <div className="senec-solar__cell" />
                      <div className="senec-solar__cell" />
                      <div className="senec-solar__shimmer" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Chimney */}
          <div className="senec-house__chimney" />
        </div>

        {/* Ground Elements */}
        <div className="senec-ground">
          {/* Driveway */}
          <div className="senec-ground__driveway" />

          {/* Grass patches */}
          <div className="senec-ground__grass senec-ground__grass--1" />
          <div className="senec-ground__grass senec-ground__grass--2" />
        </div>

        {/* Electric Car (if Wallbox) */}
        {hasWallbox && (
          <div className="senec-car">
            <div className="senec-car__body" />
            <div className="senec-car__roof" />
            <div className="senec-car__window" />
            <div className="senec-car__wheel senec-car__wheel--front" />
            <div className="senec-car__wheel senec-car__wheel--rear" />
            <div className="senec-car__charge-cable" />
          </div>
        )}

        {/* Wallbox Unit */}
        {hasWallbox && (
          <div className="senec-wallbox">
            <div className="senec-wallbox__unit">
              <div className="senec-wallbox__led senec-wallbox__led--active" />
            </div>
          </div>
        )}

        {/* Heat Pump */}
        {hasHeatpump && (
          <div className="senec-heatpump">
            <div className="senec-heatpump__unit">
              <div className="senec-heatpump__fan">
                <div className="senec-heatpump__blade" />
                <div className="senec-heatpump__blade" />
                <div className="senec-heatpump__blade" />
                <div className="senec-heatpump__blade" />
              </div>
            </div>
          </div>
        )}

        {/* Power Grid Pole */}
        <div className="senec-grid">
          <div className="senec-grid__pole" />
          <div className="senec-grid__arm senec-grid__arm--1" />
          <div className="senec-grid__arm senec-grid__arm--2" />
          <div className="senec-grid__wire" />
        </div>
      </div>

      {/* Energy Flow Overlay */}
      <svg className="senec-flow" viewBox="0 0 500 350" preserveAspectRatio="xMidYMid meet">
        <defs>
          <filter id="glow-yellow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="glow-green" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="glow-blue" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Solar to House Flow */}
        {hasPV && (
          <g className="senec-flow__solar">
            <path d="M 200 60 Q 200 120 220 160" stroke="#fbbf24" strokeWidth="3" fill="none" opacity="0.3" />
            <circle r="6" fill="#fbbf24" filter="url(#glow-yellow)">
              <animateMotion dur="1.5s" repeatCount="indefinite" path="M 200 60 Q 200 120 220 160" />
            </circle>
            <circle r="5" fill="#fef08a">
              <animateMotion dur="1.5s" repeatCount="indefinite" path="M 200 60 Q 200 120 220 160" begin="0.5s" />
            </circle>
            <circle r="4" fill="#fbbf24" filter="url(#glow-yellow)">
              <animateMotion dur="1.5s" repeatCount="indefinite" path="M 200 60 Q 200 120 220 160" begin="1s" />
            </circle>
          </g>
        )}

        {/* House to Battery Flow */}
        {hasBattery && (
          <g className="senec-flow__battery">
            <path d="M 260 200 L 320 200" stroke="#22c55e" strokeWidth="3" fill="none" opacity="0.3" />
            <circle r="5" fill="#22c55e" filter="url(#glow-green)">
              <animateMotion dur="1s" repeatCount="indefinite" path="M 260 200 L 320 200" />
            </circle>
          </g>
        )}

        {/* House to Grid Flow */}
        <g className="senec-flow__grid">
          <path d="M 140 220 Q 80 220 60 280" stroke="#3b82f6" strokeWidth="3" fill="none" opacity="0.3" />
          <circle r="5" fill="#3b82f6" filter="url(#glow-blue)">
            <animateMotion dur="2s" repeatCount="indefinite" path="M 140 220 Q 80 220 60 280" />
          </circle>
        </g>

        {/* House to Wallbox Flow */}
        {hasWallbox && (
          <g className="senec-flow__wallbox">
            <path d="M 280 230 Q 340 250 380 280" stroke="#06b6d4" strokeWidth="3" fill="none" opacity="0.3" />
            <circle r="5" fill="#06b6d4" filter="url(#glow-blue)">
              <animateMotion dur="2s" repeatCount="indefinite" path="M 280 230 Q 340 250 380 280" />
            </circle>
          </g>
        )}
      </svg>

      {/* Data Labels */}
      <div className="senec-labels">
        {/* PV Label */}
        {hasPV && (
          <div
            className={`senec-label senec-label--pv ${activeComponent === 'pv' ? 'senec-label--active' : ''}`}
            onMouseEnter={() => setActiveComponent('pv')}
            onMouseLeave={() => setActiveComponent(null)}
          >
            <div className="senec-label__icon">☀️</div>
            <div className="senec-label__content">
              <div className="senec-label__title">PV-Anlage</div>
              <div className="senec-label__value">{totalKwp.toFixed(2)} <span>kWp</span></div>
            </div>
            <div className="senec-label__glow" />
          </div>
        )}

        {/* Inverter Label */}
        <div
          className={`senec-label senec-label--inverter ${activeComponent === 'inverter' ? 'senec-label--active' : ''}`}
          onMouseEnter={() => setActiveComponent('inverter')}
          onMouseLeave={() => setActiveComponent(null)}
        >
          <div className="senec-label__icon">⚡</div>
          <div className="senec-label__content">
            <div className="senec-label__title">Wechselrichter</div>
            <div className="senec-label__value">{displayInverterKw.toFixed(1)} <span>kW</span></div>
          </div>
          <div className="senec-label__glow" />
        </div>

        {/* Battery Label */}
        {hasBattery && (
          <div
            className={`senec-label senec-label--battery ${activeComponent === 'battery' ? 'senec-label--active' : ''}`}
            onMouseEnter={() => setActiveComponent('battery')}
            onMouseLeave={() => setActiveComponent(null)}
          >
            <div className="senec-label__icon">🔋</div>
            <div className="senec-label__content">
              <div className="senec-label__title">Speicher</div>
              <div className="senec-label__value">{speicherKwh.toFixed(1)} <span>kWh</span></div>
            </div>
            <div className="senec-label__battery-level" style={{ width: '75%' }} />
            <div className="senec-label__glow" />
          </div>
        )}

        {/* Grid Label */}
        <div
          className={`senec-label senec-label--grid ${activeComponent === 'grid' ? 'senec-label--active' : ''}`}
          onMouseEnter={() => setActiveComponent('grid')}
          onMouseLeave={() => setActiveComponent(null)}
        >
          <div className="senec-label__icon">🔌</div>
          <div className="senec-label__content">
            <div className="senec-label__title">Stromnetz</div>
            <div className="senec-label__value">{messkonzept?.toUpperCase() || 'ZSU'}</div>
          </div>
          <div className="senec-label__glow" />
        </div>

        {/* Wallbox Label */}
        {hasWallbox && (
          <div
            className={`senec-label senec-label--wallbox ${activeComponent === 'wallbox' ? 'senec-label--active' : ''}`}
            onMouseEnter={() => setActiveComponent('wallbox')}
            onMouseLeave={() => setActiveComponent(null)}
          >
            <div className="senec-label__icon">🚗</div>
            <div className="senec-label__content">
              <div className="senec-label__title">Wallbox</div>
              <div className="senec-label__value">{wallboxKw.toFixed(0)} <span>kW</span></div>
            </div>
            <div className="senec-label__glow" />
          </div>
        )}

        {/* Heatpump Label */}
        {hasHeatpump && (
          <div
            className={`senec-label senec-label--heatpump ${activeComponent === 'heatpump' ? 'senec-label--active' : ''}`}
            onMouseEnter={() => setActiveComponent('heatpump')}
            onMouseLeave={() => setActiveComponent(null)}
          >
            <div className="senec-label__icon">🌡️</div>
            <div className="senec-label__content">
              <div className="senec-label__title">Wärmepumpe</div>
              <div className="senec-label__value">{waermepumpeKw.toFixed(1)} <span>kW</span></div>
            </div>
            <div className="senec-label__glow" />
          </div>
        )}
      </div>

      {/* Info Panel (on hover) */}
      {activeComponent && (
        <div className={`senec-info senec-info--${activeComponent}`}>
          {activeComponent === 'pv' && (
            <>
              <h4>☀️ Photovoltaik-Anlage</h4>
              <div className="senec-info__stat">
                <span>Peak-Leistung</span>
                <strong>{totalKwp.toFixed(2)} kWp</strong>
              </div>
              <div className="senec-info__stat">
                <span>Jahresertrag (ca.)</span>
                <strong>{Math.round(totalKwp * 950)} kWh</strong>
              </div>
              <div className="senec-info__stat">
                <span>CO₂-Ersparnis</span>
                <strong>{Math.round(totalKwp * 950 * 0.4)} kg/Jahr</strong>
              </div>
            </>
          )}
          {activeComponent === 'inverter' && (
            <>
              <h4>⚡ Wechselrichter</h4>
              <div className="senec-info__stat">
                <span>AC-Leistung</span>
                <strong>{displayInverterKw.toFixed(1)} kW</strong>
              </div>
              <div className="senec-info__stat">
                <span>Funktion</span>
                <strong>DC → AC Wandlung</strong>
              </div>
            </>
          )}
          {activeComponent === 'battery' && (
            <>
              <h4>🔋 Batteriespeicher</h4>
              <div className="senec-info__stat">
                <span>Kapazität</span>
                <strong>{speicherKwh.toFixed(1)} kWh</strong>
              </div>
              <div className="senec-info__stat">
                <span>Nutzbar (90%)</span>
                <strong>{(speicherKwh * 0.9).toFixed(1)} kWh</strong>
              </div>
              <div className="senec-info__stat">
                <span>Eigenverbrauch</span>
                <strong>+30-40%</strong>
              </div>
            </>
          )}
          {activeComponent === 'grid' && (
            <>
              <h4>🔌 Netzanschluss</h4>
              <div className="senec-info__stat">
                <span>Messkonzept</span>
                <strong>{messkonzept?.toUpperCase() || 'ZSU'}</strong>
              </div>
              <div className="senec-info__stat">
                <span>Funktion</span>
                <strong>Einspeisung & Bezug</strong>
              </div>
            </>
          )}
          {activeComponent === 'wallbox' && (
            <>
              <h4>🚗 Wallbox</h4>
              <div className="senec-info__stat">
                <span>Ladeleistung</span>
                <strong>{wallboxKw.toFixed(1)} kW</strong>
              </div>
              <div className="senec-info__stat">
                <span>Anschluss</span>
                <strong>Typ 2</strong>
              </div>
              <div className="senec-info__stat">
                <span>Ladezeit (60kWh)</span>
                <strong>~{Math.round(60 / wallboxKw)} Std.</strong>
              </div>
            </>
          )}
          {activeComponent === 'heatpump' && (
            <>
              <h4>🌡️ Wärmepumpe</h4>
              <div className="senec-info__stat">
                <span>Heizleistung</span>
                <strong>{waermepumpeKw.toFixed(1)} kW</strong>
              </div>
              <div className="senec-info__stat">
                <span>COP (ca.)</span>
                <strong>3.5 - 4.5</strong>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default AnlageVisualisierung;
