import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Check, Sparkles, Zap, Shield, ArrowLeft,
  ChevronRight, Star, HelpCircle
} from 'lucide-react';
import PageContainer from '../../../components/layout/PageContainer';
import Button from '../../../components/common/Button';
import { AdminConfirmModal } from '../../../components/ui/AdminModal';
import { useToast } from '../../../components/feedback/Toast';
import { ROUTES } from '../../../constants/routes';

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    tagline: 'Ideal for small academies and coaching centers.',
    monthlyPrice: 49,
    annualPrice: 39,
    isCurrent: false,
    isPopular: false,
    features: [
      'Up to 250 Active Learners',
      '50 GB Video Storage',
      'Standard Quiz Assessments',
      'Course Completion Certificates',
      'Standard Email Support',
    ],
  },
  {
    id: 'professional',
    name: 'Professional',
    tagline: 'Perfect for growing bootcamps and institutes.',
    monthlyPrice: 149,
    annualPrice: 119,
    isCurrent: false,
    isPopular: true,
    features: [
      'Up to 1,000 Active Learners',
      '200 GB Video Storage',
      'Monaco Coding Assessments (Python, C++, Java, JS)',
      'Custom Branded Certificates',
      'Automated Rubrics & Instructor Grading',
      'Priority Support (24h response)',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise Pro',
    tagline: 'Tailored for large universities and enterprise training.',
    monthlyPrice: 299,
    annualPrice: 239,
    isCurrent: true,
    isPopular: false,
    features: [
      'Up to 2,500+ Active Learners',
      '500 GB Video Storage',
      'Unlimited Coding Assessments & Rubrics',
      'Single Sign-On (SAML 2.0 / Okta / Google)',
      'Custom Subdomain & CNAME Domain',
      'Dedicated Account Manager & 99.9% SLA',
      'Audit Logs & Compliance Reports',
    ],
  },
];

export const PlansPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [isAnnual, setIsAnnual] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSelectPlan = (plan) => {
    if (plan.isCurrent) return;
    setSelectedPlan(plan);
    setIsModalOpen(true);
  };

  const handleConfirmChange = async () => {
    setIsUpdating(true);
    try {
      // TODO: replace with real plan-change API once billing backend is implemented
      // await subscriptionService.changePlan({ planId: selectedPlan.id, annual: isAnnual });
      throw new Error('Billing API not yet implemented');
    } catch {
      toast.error('Plan changes are not available yet. Please contact your platform administrator.');
      setIsModalOpen(false);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <PageContainer
      title="Subscription Plans"
      subtitle="Select the perfect tier for your learning organization."
      actions={
        <Button
          variant="secondary"
          onClick={() => navigate(ROUTES.SUBSCRIPTION)}
          iconLeft={<ArrowLeft size={15} />}
        >
          My Subscription
        </Button>
      }
    >
      <div style={{ maxWidth: 1150, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 32 }}>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-muted)' }}>
          <Link to={ROUTES.SUBSCRIPTION} style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
            Subscription
          </Link>
          <ChevronRight size={13} />
          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Plans & Pricing</span>
        </div>

        {/* ── Monthly / Annual Billing Toggle ── */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 14 }}>
          <span style={{
            fontSize: 14, fontWeight: isAnnual ? 500 : 700,
            color: isAnnual ? 'var(--text-muted)' : 'var(--text-primary)',
          }}>
            Monthly Billing
          </span>

          <button
            type="button"
            onClick={() => setIsAnnual((v) => !v)}
            style={{
              width: 50,
              height: 28,
              borderRadius: 20,
              background: isAnnual ? '#6366f1' : 'var(--border-color)',
              border: 'none',
              cursor: 'pointer',
              position: 'relative',
              transition: 'background 0.2s ease',
              padding: 3,
            }}
          >
            <div style={{
              width: 22,
              height: 22,
              borderRadius: '50%',
              background: '#ffffff',
              transform: isAnnual ? 'translateX(22px)' : 'translateX(0)',
              transition: 'transform 0.2s ease',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            }} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              fontSize: 14, fontWeight: isAnnual ? 700 : 500,
              color: isAnnual ? 'var(--text-primary)' : 'var(--text-muted)',
            }}>
              Annual Billing
            </span>
            <span style={{
              fontSize: 11,
              fontWeight: 700,
              background: 'rgba(34, 197, 94, 0.15)',
              color: '#10b981',
              padding: '2px 8px',
              borderRadius: 12,
              letterSpacing: '0.02em',
            }}>
              Save 20%
            </span>
          </div>
        </div>

        {/* ── Plan Cards Grid ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 24,
          alignItems: 'stretch',
        }}>
          {PLANS.map((plan) => {
            const price = isAnnual ? plan.annualPrice : plan.monthlyPrice;

            return (
              <div
                key={plan.id}
                style={{
                  background: 'var(--bg-primary)',
                  border: plan.isPopular
                    ? '2px solid #6366f1'
                    : plan.isCurrent
                    ? '2px solid #10b981'
                    : '1px solid var(--border-color)',
                  borderRadius: 18,
                  padding: 30,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: 24,
                  boxShadow: plan.isPopular ? '0 12px 30px rgba(99,102,241,0.15)' : '0 4px 16px rgba(0,0,0,0.03)',
                  position: 'relative',
                }}
              >
                {/* Popular / Current Ribbon */}
                {plan.isPopular && (
                  <div style={{
                    position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)',
                    background: '#6366f1', color: '#ffffff', fontSize: 11, fontWeight: 800,
                    padding: '3px 14px', borderRadius: 20, letterSpacing: '0.06em', textTransform: 'uppercase',
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}>
                    <Star size={11} fill="#ffffff" /> Most Popular
                  </div>
                )}
                {plan.isCurrent && (
                  <div style={{
                    position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)',
                    background: '#10b981', color: '#ffffff', fontSize: 11, fontWeight: 800,
                    padding: '3px 14px', borderRadius: 20, letterSpacing: '0.06em', textTransform: 'uppercase',
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}>
                    <Check size={11} /> Current Plan
                  </div>
                )}

                {/* Top Section */}
                <div>
                  <h3 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>
                    {plan.name}
                  </h3>
                  <p style={{ margin: '0 0 20px', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.4 }}>
                    {plan.tagline}
                  </p>

                  {/* Price */}
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 24 }}>
                    <span style={{ fontSize: 36, fontWeight: 900, color: 'var(--text-primary)' }}>
                      ${price}
                    </span>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                      / month {isAnnual ? '(billed annually)' : ''}
                    </span>
                  </div>

                  {/* Features List */}
                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                      Included Features:
                    </p>
                    {plan.features.map((feat, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: 'var(--text-primary)' }}>
                        <Check size={16} style={{ color: '#10b981', flexShrink: 0, marginTop: 2 }} />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTA Action Button */}
                <div>
                  <button
                    type="button"
                    disabled={plan.isCurrent}
                    onClick={() => handleSelectPlan(plan)}
                    style={{
                      width: '100%',
                      padding: '12px 20px',
                      borderRadius: 10,
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: plan.isCurrent ? 'default' : 'pointer',
                      border: plan.isCurrent ? '1.5px solid #10b981' : 'none',
                      background: plan.isCurrent
                        ? 'rgba(16, 185, 129, 0.1)'
                        : plan.isPopular
                        ? '#6366f1'
                        : 'var(--surface-medium)',
                      color: plan.isCurrent
                        ? '#10b981'
                        : plan.isPopular
                        ? '#ffffff'
                        : 'var(--text-primary)',
                      transition: 'opacity 0.15s ease',
                    }}
                  >
                    {plan.isCurrent ? 'Current Plan' : `Upgrade to ${plan.name}`}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Confirmation Modal */}
      <AdminConfirmModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmChange}
        title="Confirm Plan Change"
        message={`Are you sure you want to switch to the ${selectedPlan?.name} plan at $${isAnnual ? selectedPlan?.annualPrice : selectedPlan?.monthlyPrice}/month? Your next invoice will reflect prorated charges.`}
        confirmText="Confirm Upgrade"
        confirmTone="primary"
        isLoading={isUpdating}
      />
    </PageContainer>
  );
};

export default PlansPage;
