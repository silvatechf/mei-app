import React, { useEffect, useState } from 'react';
import { ShieldCheck, ArrowUpRight, CheckCircle2, HelpCircle, ClipboardCheck, CalendarDays, ExternalLink, AlertTriangle, Landmark, FileText, HeartHandshake, ChevronDown, ChevronUp, RotateCcw, Download, Upload } from 'lucide-react';

const OFFICIAL = {
  pgfn: 'https://www.gov.br/pgfn/pt-br/servicos/perguntas-frequentes/perguntas-frequentes-perdao-do-mei',
  receita: 'https://servicos.receitafederal.gov.br/',
  regularize: 'https://www.regularize.pgfn.gov.br/',
  pgmei: 'https://www8.receita.fazenda.gov.br/simplesnacional/aplicacoes/atspo/pgmei.app/identificacao',
  law: 'https://www2.camara.leg.br/legin/fed/leicom/2026/leicomplementar-238-21-outubro-2026-800071-norma-pl.html',
};

type Debt = 'previdenciaria' | 'mista' | 'icms_iss' | 'bancaria' | 'nao_sei';
type Location = 'receita' | 'divida_ativa' | 'parcelada' | 'nao_sei';

type OrganizerTask = { id: string; title: string; date: string; detail: string; important?: boolean };
const ORGANIZER_TASKS: OrganizerTask[] = [
  { id: 'check-regularize', title: 'Consultar o extrato nos canais oficiais', date: '2026-11-02', detail: 'Guarde o extrato e identifique quais tributos aparecem.' },
  { id: 'remission', title: 'Voltar a conferir a baixa dos débitos elegíveis', date: '2027-01-01', detail: 'A PGFN prevê início da identificação e baixa nesta data; não significa que todo débito será apagado.', important: true },
  { id: 'das-jan', title: 'Conferir e pagar o DAS de janeiro', date: '2027-01-20', detail: 'Se continuar como MEI, mantenha os pagamentos correntes em dia.' },
  { id: 'das-feb', title: 'Conferir e pagar o DAS de fevereiro', date: '2027-02-22', detail: 'Dia 20 cai em sábado; confira o vencimento no PGMEI.' },
  { id: 'das-mar', title: 'Conferir e pagar o DAS de março', date: '2027-03-22', detail: 'Confirme o vencimento oficial no PGMEI.' },
  { id: 'das-apr', title: 'Conferir e pagar o DAS de abril', date: '2027-04-20', detail: 'Guarde o comprovante de pagamento.' },
  { id: 'das-may', title: 'Conferir e pagar o DAS de maio', date: '2027-05-20', detail: 'Guarde o comprovante de pagamento.' },
  { id: 'dasn', title: 'Entregar a declaração anual DASN-SIMEI', date: '2027-05-31', detail: 'A declaração anual costuma vencer em 31 de maio, mesmo sem faturamento.' },
  { id: 'das-jun', title: 'Conferir e pagar o DAS de junho', date: '2027-06-21', detail: 'Dia 20 cai em domingo; confirme o vencimento no PGMEI.' },
];

function formatDate(value: string) { return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${value}T12:00:00Z`)); }

function escapeIcs(value: string) { return value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;'); }
function downloadCalendar(tasks: OrganizerTask[], completed: string[]) {
  const pending = tasks.filter(task => !completed.includes(task.id));
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const events = pending.map(task => {
    const date = task.date.replace(/-/g, '');
    return ['BEGIN:VEVENT', `UID:${task.id}@mei-em-dia.local`, `DTSTAMP:${stamp}`, `DTSTART;VALUE=DATE:${date}`, `SUMMARY:${escapeIcs(task.title)}`, `DESCRIPTION:${escapeIcs(task.detail + ' Confirme o vencimento nos canais oficiais.')}`, 'BEGIN:VALARM', 'TRIGGER:-P1D', 'ACTION:DISPLAY', `DESCRIPTION:${escapeIcs('Lembrete: ' + task.title)}`, 'END:VALARM', 'END:VEVENT'].join('\r\n');
  });
  const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//MEI em Dia//Organizador de prazos//PT-BR', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', ...events, 'END:VCALENDAR'].join('\r\n');
  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
  const link = document.createElement('a'); link.href = url; link.download = 'mei-em-dia-prazos.ics'; document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
}

function OfficialLink({ href, children }: { href: string; children: React.ReactNode }) {
  return <a className="official-link" href={href} target="_blank" rel="noreferrer">{children}<ExternalLink size={15} /></a>;
}

export default function App() {
  const [intent, setIntent] = useState<'perdao' | 'golpe' | 'boleto' | 'inicio' | ''>('');
  const [questionStep, setQuestionStep] = useState(1);
  const [debt, setDebt] = useState<Debt | ''>('');
  const [location, setLocation] = useState<Location | ''>('');
  const [activeMei, setActiveMei] = useState<'sim' | 'nao' | ''>('');
  const [showFaq, setShowFaq] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [offline, setOffline] = useState(!navigator.onLine);
  const [completedTasks, setCompletedTasks] = useState<string[]>(() => { try { return JSON.parse(localStorage.getItem('mei-em-dia-tarefas-v1') || '[]'); } catch { return []; } });
  const [showAllTasks, setShowAllTasks] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [calendarMessage, setCalendarMessage] = useState('');
  useEffect(() => { try { localStorage.setItem('mei-em-dia-tarefas-v1', JSON.stringify(completedTasks)); } catch { /* armazenamento local pode estar indisponível */ } }, [completedTasks]);
  const toggleTask = (id: string) => setCompletedTasks(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const nextTasks = ORGANIZER_TASKS.filter(task => !completedTasks.includes(task.id) && new Date(`${task.date}T00:00:00`) >= today).slice(0, showAllTasks ? ORGANIZER_TASKS.length : 4);
  const completedCount = ORGANIZER_TASKS.filter(task => completedTasks.includes(task.id)).length;

  useEffect(() => {
    const onInstall = (event: Event) => { event.preventDefault(); setInstallPrompt(event); };
    const onOnline = () => setOffline(false);
    const onOffline = () => setOffline(true);
    window.addEventListener('beforeinstallprompt', onInstall);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => { window.removeEventListener('beforeinstallprompt', onInstall); window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOffline); };
  }, []);
  const installApp = async () => { if (!installPrompt) return; await installPrompt.prompt(); setInstallPrompt(null); };
  const reset = () => { setDebt(''); setLocation(''); setActiveMei(''); setShowResult(false); setQuestionStep(1); setIntent(''); };
  const beginGuide = (value: typeof intent) => { setIntent(value); setQuestionStep(1); setShowResult(false); };
  const nextQuestion = () => setQuestionStep(value => Math.min(3, value + 1));
  const previousQuestion = () => setQuestionStep(value => Math.max(1, value - 1));
  const canAssess = Boolean(debt && location && activeMei);

  return <div className="app-shell">
    <header className="topbar"><div className="brand"><div className="brand-icon" aria-hidden="true"><span>MEI</span><i>em Dia</i><b /></div><div><div className="brand-name">MEI em Dia</div><div className="brand-sub">Guia independente de orientação</div></div></div><div className="topbar-actions">{installPrompt && <button className="install-button" onClick={installApp}>Instalar app</button>}<span className="free-pill">Gratuito · Sem cadastro</span></div></header>
    <main>
      {offline && <div className="offline-banner" role="status"><CheckCircle2 size={16}/> Você está offline. O guia continua disponível; os links oficiais precisam de internet.</div>}
      <section className="hero">
        <div className="hero-copy"><div className="eyebrow"><span className="live-dot"/> GUIA INDEPENDENTE · OUT 2026</div><h1>Entenda o perdão de dívidas do MEI <span>sem complicação.</span></h1><p>Responda a 3 perguntas rápidas e veja quais são os próximos passos para conferir sua situação nos canais oficiais.</p><div className="hero-points"><span><CheckCircle2 size={16}/> Linguagem simples</span><span><CheckCircle2 size={16}/> Links oficiais</span><span><CheckCircle2 size={16}/> Sem envio de respostas</span></div></div>
        <div className="hero-art" aria-hidden="true"><div className="art-circle"><Landmark size={52}/></div><div className="art-card"><CheckCircle2 size={17}/><span>Informação oficial em primeiro lugar</span></div><div className="art-spark spark-one">✳</div><div className="art-spark spark-two">✦</div></div>
      </section>

      <section className="notice"><div className="notice-icon"><AlertTriangle size={21}/></div><div><strong>Importante: o perdão não significa que toda dívida do MEI desaparece.</strong><p>A Lei Complementar nº 238/2026 trata de débitos federais específicos. ICMS, ISS e dívidas bancárias não entram nesse perdão federal. A baixa está prevista para <b>1º de janeiro de 2027</b>.</p><OfficialLink href={OFFICIAL.pgfn}>Ler perguntas frequentes da PGFN</OfficialLink></div></section>

      <section className="organizer-panel" aria-labelledby="organizer-title">
        <div className="organizer-header"><div><span className="section-kicker">SEU PLANO</span><h2 id="organizer-title">O que você precisa fazer</h2><p>Marque uma tarefa quando terminar. Seu progresso fica salvo automaticamente neste aparelho.</p></div><div className="progress-bubble"><b>{completedCount}/{ORGANIZER_TASKS.length}</b><span>concluídos</span></div></div>
        <div className="progress-track" role="progressbar" aria-label="Tarefas concluídas" aria-valuemin={0} aria-valuemax={ORGANIZER_TASKS.length} aria-valuenow={completedCount}><span style={{width:`${completedCount / ORGANIZER_TASKS.length * 100}%`}} /></div>
        <div className="organizer-list">{(showAllTasks ? ORGANIZER_TASKS : nextTasks).map(task => <label key={task.id} className={`organizer-task ${completedTasks.includes(task.id) ? 'task-done' : ''}`}><input type="checkbox" checked={completedTasks.includes(task.id)} onChange={() => toggleTask(task.id)} /><span className="task-copy"><span className="task-title">{task.title}{task.important && <em>Data importante</em>}</span><span className="task-detail">{task.detail}</span></span><time dateTime={task.date}>{formatDate(task.date)}</time></label>)}</div>
        <div className="organizer-footer"><span><ShieldCheck size={16}/> As datas são referências. Confira as informações nos canais oficiais.</span><button className="text-button" onClick={() => setShowAllTasks(value => !value)}>{showAllTasks ? 'Mostrar só os próximos passos' : 'Ver todos os passos'} <ArrowUpRight size={15}/></button></div>
        <div className="organizer-actions organizer-actions-primary">
          <button className="more-options-button" aria-expanded={showMoreOptions} onClick={() => setShowMoreOptions(value => !value)}>{showMoreOptions ? 'Fechar opções extras' : 'Preciso de mais opções'} <ChevronDown size={15}/></button>
        </div>
        {showMoreOptions && <div className="backup-options"><div><strong>Quer receber lembretes no seu calendário?</strong><p>Vamos preparar uma lista de datas. Depois, será preciso abrir o arquivo e confirmar a adição no aplicativo de calendário. Os avisos dependem desse aplicativo.</p></div><button className="secondary-button calendar-primary" onClick={() => { downloadCalendar(ORGANIZER_TASKS, completedTasks); setCalendarMessage('Arquivo criado. Abra o arquivo baixado e siga as instruções do seu calendário para adicionar as datas.'); }}><CalendarDays size={17}/> Preparar datas para meu calendário</button>{calendarMessage && <p className="calendar-feedback" role="status">{calendarMessage}</p>}<div><strong>Guardar ou recuperar meu progresso</strong><p>Você não precisa fazer isso no uso normal. Use essas opções apenas para guardar uma cópia ou levar seu progresso para outro aparelho.</p></div><button className="secondary-button" onClick={() => { const data = JSON.stringify({ version: 1, completedTasks, exportedAt: new Date().toISOString() }, null, 2); const url = URL.createObjectURL(new Blob([data], { type: 'application/json' })); const link = document.createElement('a'); link.href = url; link.download = 'mei-em-dia-progresso.json'; document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url); }}><Download size={16}/> Guardar uma cópia</button><label className="secondary-button import-button"><Upload size={16}/> Recuperar uma cópia guardada<input type="file" accept="application/json,.json" aria-label="Selecionar cópia do progresso" onChange={async event => { const file = event.target.files?.[0]; if (!file) return; try { const parsed = JSON.parse(await file.text()); if (parsed.version !== 1 || !Array.isArray(parsed.completedTasks) || parsed.completedTasks.some((id: unknown) => typeof id !== 'string' || !ORGANIZER_TASKS.some(task => task.id === id))) throw new Error('Arquivo inválido'); setCompletedTasks(parsed.completedTasks); alert('Seu progresso foi recuperado neste dispositivo.'); } catch { alert('Não foi possível recuperar o progresso. Escolha uma cópia válida do MEI em Dia.'); } event.target.value = ''; }} /></label></div>}
        <p className="organizer-note">Seu progresso é salvo automaticamente neste navegador. Para os lembretes, o calendário utilizado precisa aceitar a importação e estar configurado para mostrar alertas. As datas são referências: confirme cada vencimento no canal oficial.</p>
      </section>

      <section className="steps-layout guided-layout">
        <div className="form-panel guided-panel">
          {!intent && <>
            <div className="panel-heading"><div><span className="section-kicker">VAMOS POR PARTES</span><h2>O que está acontecendo?</h2><p>Escolha a opção mais parecida com sua dúvida. Você não precisa saber termos técnicos.</p></div></div>
            <div className="option-grid guided-intents">
              <button className="option" onClick={() => beginGuide('perdao')}><span className="radio-dot"/><span className="option-text"><b>Quero saber se minha dívida foi perdoada</b><small>Entender o que conferir nos canais oficiais.</small></span></button>
              <button className="option" onClick={() => beginGuide('golpe')}><span className="radio-dot"/><span className="option-text"><b>Recebi uma mensagem e tenho medo de ser golpe</b><small>Ver como agir sem compartilhar dados.</small></span></button>
              <button className="option" onClick={() => beginGuide('boleto')}><span className="radio-dot"/><span className="option-text"><b>Meu boleto ainda mostra um valor</b><small>Entender por que é preciso conferir a cobrança.</small></span></button>
              <button className="option" onClick={() => beginGuide('inicio')}><span className="radio-dot"/><span className="option-text"><b>Não sei por onde começar</b><small>Vamos encontrar o primeiro passo juntos.</small></span></button>
            </div>
            <p className="privacy-note"><ShieldCheck size={14}/> Não informe CPF, CNPJ, senhas nem códigos de autenticação.</p>
          </>}
          {intent === 'golpe' && <div className="guided-answer" aria-live="polite"><div className="result-icon"><ShieldCheck size={24}/></div><span className="section-kicker">PRIMEIRO, PROTEJA-SE</span><h2>Não clique nem pague por enquanto.</h2><p>Não existe selo ou logotipo que, sozinho, prove que uma mensagem é verdadeira. Não informe senhas, códigos ou dados bancários e não pague uma taxa para “liberar” o perdão.</p><ol><li>Abra o portal oficial digitando o endereço no navegador.</li><li>Confira sua situação diretamente na Receita Federal ou no Regularize.</li><li>Se a mensagem pedir urgência, pagamento ou dados pessoais, desconfie.</li></ol><div className="link-row"><OfficialLink href={OFFICIAL.pgfn}>Orientação oficial da PGFN</OfficialLink><OfficialLink href={OFFICIAL.receita}>Abrir Receita Federal</OfficialLink></div><button className="secondary-button" onClick={reset}><RotateCcw size={16}/> Voltar ao início</button></div>}
          {intent && intent !== 'golpe' && !showResult && <>
            <div className="guided-progress"><span>PASSO {questionStep} DE 3</span><div><i style={{width:`${questionStep / 3 * 100}%`}}/></div></div>
            {questionStep === 1 && <div className="question"><div className="question-title"><span className="number">1</span><div><h3>Que tipo de dívida aparece?</h3><p>Se não tiver certeza, escolha “Não sei”.</p></div></div><div className="option-grid">{([['previdenciaria','DAS / contribuição do INSS','Contribuição mensal do MEI.'],['mista','DAS com vários tributos','Pode incluir mais de um imposto.'],['icms_iss','ICMS ou ISS','Imposto estadual ou municipal.'],['bancaria','Empréstimo ou dívida bancária','Dívida com banco ou financeira.'],['nao_sei','Não sei identificar','Ajude-me a descobrir onde consultar.']] as [Debt,string,string][]).map(([value,title,desc])=><button key={value} className={`option ${debt===value?'selected':''}`} onClick={()=>{setDebt(value);setShowResult(false)}} aria-pressed={debt===value}><span className="radio-dot"/><span className="option-text"><b>{title}</b><small>{desc}</small></span></button>)}</div></div>}
            {questionStep === 2 && <div className="question"><div className="question-title"><span className="number">2</span><div><h3>Onde você viu essa dívida?</h3><p>Escolha a opção mais próxima do que viu.</p></div></div><div className="option-grid two-col">{([['receita','Receita Federal / Portal do Simples'],['divida_ativa','Dívida Ativa / Regularize'],['parcelada','Em parcelamento ou negociação'],['nao_sei','Não sei / ainda não consultei']] as [Location,string][]).map(([value,title])=><button key={value} className={`option compact ${location===value?'selected':''}`} onClick={()=>{setLocation(value);setShowResult(false)}} aria-pressed={location===value}><span className="radio-dot"/><span className="option-text"><b>{title}</b></span></button>)}</div></div>}
            {questionStep === 3 && <div className="question"><div className="question-title"><span className="number">3</span><div><h3>Você continua como MEI?</h3><p>Isso importa para a regra de pagamentos futuros.</p></div></div><div className="option-grid two-col">{([['sim','Sim, continuo como MEI'],['nao','Não, encerrei ou mudei de categoria']] as ['sim'|'nao',string][]).map(([value,title])=><button key={value} className={`option compact ${activeMei===value?'selected':''}`} onClick={()=>{setActiveMei(value);setShowResult(false)}} aria-pressed={activeMei===value}><span className="radio-dot"/><span className="option-text"><b>{title}</b></span></button>)}</div></div>}
            <div className="guided-actions"><button className="secondary-button" onClick={questionStep===1?reset:previousQuestion}>{questionStep===1?'Voltar ao início':'Voltar'}</button><button className="primary-button" disabled={questionStep===1?!debt:questionStep===2?!location:!activeMei} onClick={questionStep<3?nextQuestion:()=>setShowResult(true)}>{questionStep<3?'Continuar':'Ver meus próximos passos'} <ArrowUpRight size={18}/></button></div>
            <p className="privacy-note"><ShieldCheck size={14}/> Suas respostas ficam neste aparelho; não são enviadas a um servidor.</p>
          </>}
        </div>
        <aside className="side-panel"><div className="side-heading"><div className="side-icon"><ClipboardCheck size={22}/></div><h3>O que é importante saber</h3></div><div className="fact"><span className="fact-number">01</span><div><b>O anúncio não confirma sua situação</b><p>É preciso consultar os débitos nos canais oficiais.</p></div></div><div className="fact"><span className="fact-number">02</span><div><b>Nem todo tributo está incluído</b><p>O perdão federal não abrange ICMS, ISS nem dívidas bancárias.</p></div></div><div className="fact"><span className="fact-number">03</span><div><b>Não pare pagamentos por conta própria</b><p>Confira as regras atuais antes de alterar pagamentos ou parcelamentos.</p></div></div><div className="side-footer"><HeartHandshake size={17}/><span>Na dúvida, consulte um canal oficial ou profissional de contabilidade.</span></div></aside>
      </section>

      {showResult && <section className="result-panel" aria-live="polite"><div className="result-title"><div className="result-icon"><CheckCircle2 size={24}/></div><div><span className="section-kicker">SEU ROTEIRO DE CONSULTA</span><h2>Estes são os próximos passos mais seguros</h2></div></div>
        {(debt==='previdenciaria' || debt==='mista' || debt==='nao_sei') && <div className="result-step"><span className="result-step-num">1</span><div><h3>Confira os débitos nos canais oficiais</h3><p>O perdão previsto na LC 238/2026 abrange contribuição previdenciária do MEI com vencimento até 13/10/2026, inclusive débitos inscritos e não inscritos. A composição exata deve ser confirmada no seu extrato.</p><div className="link-row"><OfficialLink href={OFFICIAL.receita}>Portal de Serviços da Receita Federal</OfficialLink><OfficialLink href={OFFICIAL.regularize}>Regularize / PGFN</OfficialLink></div></div></div>}
        {debt==='icms_iss' && <div className="result-step"><span className="result-step-num">!</span><div><h3>O perdão federal não cobre ICMS ou ISS</h3><p>Consulte a Secretaria da Fazenda do seu estado (ICMS) ou a prefeitura (ISS) para saber se existe uma regra local de regularização.</p><OfficialLink href={OFFICIAL.pgfn}>Ver escopo do perdão na PGFN</OfficialLink></div></div>}
        {debt==='bancaria' && <div className="result-step"><span className="result-step-num">!</span><div><h3>Dívida bancária é tratada separadamente</h3><p>A remissão tributária federal não apaga empréstimos ou financiamentos. Fale com o banco e confira apenas canais oficiais sobre eventuais programas de renegociação.</p></div></div>}
        {location==='parcelada' && <div className="result-step"><span className="result-step-num">2</span><div><h3>Não cancele seu parcelamento por conta própria</h3><p>Se o acordo mistura tributos abrangidos e não abrangidos, a PGFN orienta solicitar revisão no portal correspondente. Confirme a composição antes de alterar o acordo.</p><OfficialLink href={OFFICIAL.pgfn}>Orientação oficial sobre parcelamentos</OfficialLink></div></div>}
        <div className="result-step"><span className="result-step-num">{location==='parcelada'?'3':'2'}</span><div><h3>Organize os próximos vencimentos</h3><p>{activeMei==='sim'?'Se continuar enquadrado como MEI, a lei prevê pagamento em dia das contribuições vincendas nos seis meses seguintes para manter o benefício. Confirme datas e regras operacionais nos canais oficiais.':'A regra dos seis meses para manter o benefício é aplicável a quem permanece formalmente enquadrado como MEI. Confirme sua situação cadastral e os débitos abrangidos.'}</p><OfficialLink href={OFFICIAL.pgmei}>Acessar Portal do Simples Nacional / PGMEI</OfficialLink></div></div>
        <div className="result-caution"><AlertTriangle size={18}/><p><b>Este guia não confirma sua elegibilidade individual</b> e não substitui a consulta do extrato oficial. A situação pode variar conforme a natureza do débito e o histórico do contribuinte.</p></div><button className="secondary-button" onClick={reset}><RotateCcw size={16}/> Refazer as perguntas</button>
      </section>}

      <section className="official-section"><div className="official-intro"><span className="section-kicker">FONTES CONFIÁVEIS</span><h2>Consulte sempre os canais oficiais</h2><p>Evite links recebidos por mensagens que prometem liberar dinheiro ou exigem pagamento para “ativar” o perdão.</p></div><div className="official-cards"><a href={OFFICIAL.pgfn} target="_blank" rel="noreferrer" className="official-card"><div className="official-card-icon purple"><FileText size={22}/></div><div><b>Perguntas frequentes da PGFN</b><small>Escopo do perdão, datas e parcelamentos</small></div><ArrowUpRight size={17}/></a><a href={OFFICIAL.receita} target="_blank" rel="noreferrer" className="official-card"><div className="official-card-icon blue"><Landmark size={22}/></div><div><b>Receita Federal</b><small>Consultar débitos não inscritos</small></div><ArrowUpRight size={17}/></a><a href={OFFICIAL.regularize} target="_blank" rel="noreferrer" className="official-card"><div className="official-card-icon green"><ShieldCheck size={22}/></div><div><b>Regularize / PGFN</b><small>Consultar Dívida Ativa da União</small></div><ArrowUpRight size={17}/></a><a href={OFFICIAL.law} target="_blank" rel="noreferrer" className="official-card"><div className="official-card-icon orange"><FileText size={22}/></div><div><b>Lei Complementar nº 238/2026</b><small>Texto legal publicado</small></div><ArrowUpRight size={17}/></a></div></section>

      <section className="faq-section"><button className="faq-toggle" onClick={()=>setShowFaq(!showFaq)} aria-expanded={showFaq}><span><HelpCircle size={21}/> Dúvidas comuns sobre o perdão do MEI</span>{showFaq?<ChevronUp size={19}/>:<ChevronDown size={19}/>}</button>{showFaq&&<div className="faq-content"><details open><summary>Tenho que fazer um pedido para receber o perdão?</summary><p>A PGFN informa que não é necessário solicitar o perdão neste momento. A baixa dos débitos abrangidos está prevista para 1º de janeiro de 2027.</p></details><details><summary>O DAS inteiro será perdoado?</summary><p>Não necessariamente. A medida cobre a contribuição previdenciária do MEI e seus acréscimos. ICMS e ISS, mesmo que estejam no mesmo DAS, continuam devidos conforme as regras aplicáveis.</p></details><details><summary>Posso parar de pagar os DAS atuais?</summary><p>Não use este guia para decidir isso. Para quem permanece MEI, a lei prevê pagamento em dia das contribuições vincendas durante os seis meses seguintes para manter o benefício. Consulte a orientação oficial e mantenha seus vencimentos organizados.</p></details><details><summary>O dinheiro que já paguei será devolvido?</summary><p>Não. A orientação oficial diz que valores já pagos não são devolvidos; eles são considerados no saldo, e o saldo elegível é cancelado conforme a regra.</p></details><details><summary>Meu parcelamento inclui mais de um tipo de tributo. O que faço?</summary><p>Não cancele por conta própria. A PGFN orienta solicitar revisão do acordo misto no portal competente, conforme a dívida esteja inscrita ou não em Dívida Ativa da União.</p></details></div>}</section>
      <footer><div className="footer-brand"><span className="footer-brand-mark">MEI<span> em Dia</span></span><b>Guia independente</b></div><p>Projeto informativo independente · Não é um serviço do Governo Federal nem substitui orientação contábil ou jurídica.</p><p className="footer-date">Referências consultadas em 27/10/2026 · <a href={OFFICIAL.pgfn} target="_blank" rel="noreferrer">Fonte oficial principal</a></p></footer>
    </main>
  </div>;
}
