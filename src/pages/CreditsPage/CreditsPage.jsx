import PageLayout from '../../components/layout/PageLayout';
import Panel      from '../../components/ui/Panel';
import Avatar     from '../../components/common/Avatar';
import LizardLogo from '../../assets/icons/LizardLogo';
import styles from './CreditsPage.module.css';

const CONTRIBUTORS = [
  { name: 'FXTHai', role: 'Lead Developer', avatar: '', link: '#' },
  { name: 'Dev2',   role: 'UI Designer',    avatar: '', link: '#' },
  { name: 'Dev3',   role: 'Backend',        avatar: '', link: '#' },
  { name: 'Dev4',   role: 'Script Writer',  avatar: '', link: '#' },
  { name: 'Dev5',   role: 'Security',       avatar: '', link: '#' },
  { name: 'Dev6',   role: 'Tester',         avatar: '', link: '#' },
];

const TOP_DONATORS = [
  { username: 'User1', amount: '$50.00', platform: 'PayPal' },
  { username: 'User2', amount: '$40.00', platform: 'Stripe' },
  { username: 'User3', amount: '$30.00', platform: 'Crypto' },
  { username: 'User4', amount: '$20.00', platform: 'PayPal' },
  { username: 'User5', amount: '$15.00', platform: 'Stripe' },
];

const ROBUX_DONATORS = [
  { username: 'RbxUser1', amount: '5 000 R$' },
  { username: 'RbxUser2', amount: '3 000 R$' },
  { username: 'RbxUser3', amount: '1 500 R$' },
  { username: 'RbxUser4', amount: '500 R$'   },
];

export default function CreditsPage() {
  return (
    <PageLayout>
      <main className={styles.main}>
        <div className={styles.pageHdr}>
          <h1>Credits</h1>
          <p>Thank you to everyone who has contributed to making Lizard Hub possible</p>
        </div>

        {/* Contributors */}
        <Panel title="Contributors">
          <div className={styles.tblWrap}>
            <table className={styles.tbl}>
              <thead>
                <tr>
                  <th style={{ width: 60 }}>Avatar</th>
                  <th>Name</th><th>Role</th>
                  <th style={{ textAlign: 'right' }}>Link</th>
                </tr>
              </thead>
              <tbody>
                {CONTRIBUTORS.map(c => (
                  <tr key={c.name}>
                    <td><Avatar name={c.name} src={c.avatar} size={34} /></td>
                    <td className={styles.nameCell}>{c.name}</td>
                    <td>
                      <div className={styles.roleCell}>
                        <LizardLogo size={16} variant="purple" />
                        {c.role}
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <a className={styles.visitLink} href={c.link} target="_blank" rel="noreferrer">Visit</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <div className={styles.twoCol}>
          {/* Top donators */}
          <Panel title="Top Donators">
            <div className={styles.tblWrap}>
              <table className={styles.tbl}>
                <thead><tr><th>Username</th><th>Amount</th><th>Platform</th></tr></thead>
                <tbody>
                  {TOP_DONATORS.map(d => (
                    <tr key={d.username}>
                      <td className={styles.nameCell}>{d.username}</td>
                      <td><span className={styles.amtBadge}>{d.amount}</span></td>
                      <td>
                        <div className={styles.platBadge}>
                          <LizardLogo size={12} variant="purple" />
                          {d.platform}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          {/* Robux donators */}
          <Panel title="Robux Donators">
            <div className={styles.tblWrap}>
              <table className={styles.tbl}>
                <thead><tr><th>Username</th><th style={{ textAlign:'right' }}>Amount</th></tr></thead>
                <tbody>
                  {ROBUX_DONATORS.map(r => (
                    <tr key={r.username}>
                      <td className={styles.nameCell}>{r.username}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div className={styles.robuxCell}>
                          <LizardLogo size={16} variant="purple" />
                          <span className={styles.amtBadge}>{r.amount}</span>
                          <span className={styles.robuxLabel}>Robux</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      </main>
    </PageLayout>
  );
}
