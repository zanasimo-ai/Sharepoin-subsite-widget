import * as React from 'react';
import { SPHttpClient, SPHttpClientResponse } from '@microsoft/sp-http';
import { ISubsiteWidgetProps } from './ISubsiteWidgetProps';

interface ISubsite {
  title: string;
  url: string;
  serverRelativeUrl: string;
}

interface IState {
  sites: ISubsite[];
  filtered: ISubsite[];
  query: string;
  loading: boolean;
  error: string;
}

export default class SubsiteWidget extends React.Component<ISubsiteWidgetProps, IState> {

  constructor(props: ISubsiteWidgetProps) {
    super(props);
    this.state = { sites: [], filtered: [], query: '', loading: true, error: '' };
  }

  public componentDidMount(): void {
    this._loadSubsites();
  }

  public componentDidUpdate(prevProps: ISubsiteWidgetProps): void {
    if (prevProps.maxItems !== this.props.maxItems) {
      this._loadSubsites();
    }
  }

  private _loadSubsites(): void {
    const { webAbsoluteUrl, spHttpClient, maxItems } = this.props;
    const top = maxItems > 0 ? maxItems : 100;
    const url = `${webAbsoluteUrl}/_api/web/webs?$select=Title,Url,ServerRelativeUrl&$top=${top}`;

    this.setState({ loading: true, error: '' });

    spHttpClient.get(url, SPHttpClient.configurations.v1)
      .then((r: SPHttpClientResponse) => {
        if (!r.ok) {
          return r.text().then(text => {
            throw new Error(`HTTP ${r.status} — ${text.substring(0, 300)}`);
          });
        }
        return r.json();
      })
      .then((data: { value: { Title: string; Url: string; ServerRelativeUrl: string }[] }) => {
        const sites = (data.value || [])
          .map(w => ({
            title: w.Title.trim(),
            url: w.Url,
            serverRelativeUrl: w.ServerRelativeUrl,
          }))
          .sort((a, b) => a.title.localeCompare(b.title, 'it'));
        this.setState({ sites, filtered: sites, query: '', loading: false });
      })
      .catch((e: Error) => this.setState({ error: e.message, loading: false }));
  }

  private _onSearch = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const query = e.target.value;
    const term = query.toLowerCase();
    const filtered = term
      ? this.state.sites.filter(s =>
          s.title.toLowerCase().indexOf(term) !== -1 ||
          s.serverRelativeUrl.toLowerCase().indexOf(term) !== -1)
      : this.state.sites;
    this.setState({ query, filtered });
  }

  public render(): React.ReactElement {
    const { showSearch, maxItems } = this.props;
    const { filtered, sites, query, loading, error } = this.state;

    const styles: { [key: string]: React.CSSProperties } = {
      wrap: { fontFamily: "'Segoe UI', sans-serif", padding: '16px 0' },
      header: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
      title: { fontSize: 16, fontWeight: 600, color: '#1b1b1b', margin: 0 },
      count: { fontSize: 12, color: '#666', marginTop: 2 },
      limitNote: { fontSize: 11, color: '#888', marginTop: 2 },
      searchWrap: { position: 'relative', flex: 1, minWidth: 180, maxWidth: 300 },
      searchIcon: { position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, stroke: '#888', fill: 'none', pointerEvents: 'none' },
      searchInput: { width: '100%', padding: '7px 10px 7px 32px', fontSize: 13, border: '1px solid #d0d0d0', borderRadius: 4, outline: 'none', boxSizing: 'border-box', fontFamily: "'Segoe UI', sans-serif" },
      grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 },
      card: { background: '#fff', border: '1px solid #e0e0e0', borderRadius: 6, padding: '14px 16px', textDecoration: 'none', display: 'block' },
      icon: { width: 32, height: 32, borderRadius: 6, background: '#deecf9', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10, color: '#0078d4' },
      cardTitle: { fontSize: 13, fontWeight: 600, color: '#1b1b1b', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
      cardUrl: { fontSize: 11, color: '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
      message: { textAlign: 'center', padding: '2rem', color: '#888', fontSize: 13 },
      errorBox: { background: '#fde7e9', border: '1px solid #f1a5a8', borderRadius: 4, padding: '12px 16px', fontSize: 13, color: '#8b1b1b', wordBreak: 'break-all' },
    };

    const top = maxItems > 0 ? maxItems : 100;
    const countText = query
      ? `${filtered.length} di ${sites.length} sottositi`
      : `${sites.length} sottosit${sites.length === 1 ? 'o' : 'i'}`;

    return (
      <div style={styles.wrap}>
        <div style={styles.header}>
          <div>
            <p style={styles.title}>Sottositi</p>
            {!loading && !error && (
              <div style={styles.count}>{countText}</div>
            )}
            {!loading && !error && !query && (
              <div style={styles.limitNote}>Visualizzati i primi {top} — usa la ricerca per filtrare</div>
            )}
          </div>
          {showSearch && !loading && !error && (
            <div style={styles.searchWrap}>
              <svg style={styles.searchIcon} viewBox="0 0 24 24" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                style={styles.searchInput}
                type="text"
                placeholder="Cerca sottositi..."
                value={query}
                onChange={this._onSearch}
                autoComplete="off"
              />
            </div>
          )}
        </div>

        {loading && <div style={styles.message}>Caricamento in corso...</div>}
        {error && <div style={styles.errorBox}>Errore: {error}</div>}
        {!loading && !error && filtered.length === 0 && (
          <div style={styles.message}>{query ? 'Nessun risultato.' : 'Nessun sottosito trovato.'}</div>
        )}
        {!loading && !error && filtered.length > 0 && (
          <div style={styles.grid}>
            {filtered.map((s, i) => (
              <a key={i} href={s.url} style={styles.card}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#0078d4')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = '#e0e0e0')}>
                <div style={styles.icon}>
                  <svg width="16" height="16" viewBox="0 0 24 24" strokeWidth="1.5" fill="none" stroke="currentColor">
                    <rect x="3" y="3" width="7" height="7" rx="1"/>
                    <rect x="14" y="3" width="7" height="7" rx="1"/>
                    <rect x="3" y="14" width="7" height="7" rx="1"/>
                    <rect x="14" y="14" width="7" height="7" rx="1"/>
                  </svg>
                </div>
                <div style={styles.cardTitle}>{s.title}</div>
                <div style={styles.cardUrl}>{s.serverRelativeUrl}</div>
              </a>
            ))}
          </div>
        )}
      </div>
    );
  }
}
