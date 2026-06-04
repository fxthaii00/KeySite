import PageLayout from '../../components/layout/PageLayout';
import Panel      from '../../components/ui/Panel';
import Avatar     from '../../components/common/Avatar';
import LizardLogo from '../../assets/icons/LizardLogo';
import RobuxLogo from '../../assets/icons/RobuxLogo.png';
import DonLogo from '../../assets/icons/DonLogo.png';
import { useDonations } from '../../hooks/useDonations';
import styles from './CreditsPage.module.css';

const CONTRIBUTORS = [
  { name: 'FXTHai', role: 'Lead Developer', avatar: '', link: '#', roleIcon: DonLogo },
  { name: 'Dev2',   role: 'UI Designer',    avatar: '', link: '#', roleIcon: RobuxLogo },
  { name: 'Dev3',   role: 'Backend',        avatar: '', link: '#' },
  { name: 'Dev4',   role: 'Script Writer',  avatar: '', link: '#' },
  { name: 'Dev5',   role: 'Security',       avatar: '', link: '#' },
  { name: 'Dev6',   role: 'Tester',         avatar: '', link: '#' },
];

const DUMMY_TOP_DONATORS = [
  { username: 'User1', amount: '$50.00', platform: 'PayPal' },
  { username: 'User2', amount: '$40.00', platform: 'Stripe' },
  { username: 'User3', amount: '$30.00', platform: 'Crypto' },
  { username: 'User4', amount: '$20.00', platform: 'PayPal' },
  { username: 'User5', amount: '$15.00', platform: 'Stripe' },
];

const DUMMY_ROBUX_DONATORS = [
  { username: 'RbxUser1', amount: '5 000 R$' },
  { username: 'RbxUser2', amount: '3 000 R$' },
  { username: 'RbxUser3', amount: '1 500 R$' },
  { username: 'RbxUser4', amount: '500 R$'   },
];

function isRobuxDonation(donation) {
  const type = String(donation.type || donation.currency || '').toLowerCase();
  const amount = String(donation.amount || '').toLowerCase();
  return type.includes('robux') || type.includes('r$') || amount.includes('r$');
}

function formatAmount(amount) {
  if (typeof amount === 'number') return amount.toLocaleString();
  return amount || '0';
}

export default function CreditsPage() {
  const { donations } = useDonations();

  const robuxDonators = donations.length
    ? donations.filter(isRobuxDonation)
    : DUMMY_ROBUX_DONATORS;

  const topDonators = donations.length
    ? donations.filter(d => !isRobuxDonation(d))
    : DUMMY_TOP_DONATORS;

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
                        {c.roleIcon
                          ? <img src={c.roleIcon} alt={c.role} className={styles.roleIcon} />
                          : <LizardLogo size={16} variant="purple" />}
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
          <Panel
            title="Top Donators"
            variant="donation"
          >         
            <div className={styles.tblWrap}>
              <table className={styles.tbl}>
                <thead><tr><th>Username</th><th>Amount</th><th>Platform</th></tr></thead>
                <tbody>
                  {topDonators.map(d => (
                    <tr key={d.username}>
                      <td className={styles.nameCell}>{d.username}</td>
                      <td><span className={styles.amtBadge}>{formatAmount(d.amount)}</span></td>
                      <td>
                        <div className={styles.platBadge}>
                          <LizardLogo size={12} variant="purple" />
                          {d.platform || d.method || 'N/A'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          {/* Robux donators */}
          <Panel
            title="Robux Donators"
            variant="robux"
          >
            <div className={styles.tblWrap}>
              <table className={styles.tbl}>
                <thead><tr><th>Username</th><th style={{ textAlign:'right' }}>Amount</th></tr></thead>
                <tbody>
                  {robuxDonators.map(r => (
                    <tr key={r.username}>
                      <td className={styles.nameCell}>{r.username}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div className={styles.robuxCell}>
                          <img src={RobuxLogo} alt="Robux" style={{ width: 18, height: 18 }} />
                          <span className={styles.amtBadge}>{formatAmount(r.amount)}</span>
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
