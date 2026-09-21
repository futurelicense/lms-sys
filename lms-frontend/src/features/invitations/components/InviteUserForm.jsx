import { useState } from 'react';
import Input from '../../../components/common/Input';
import Select from '../../../components/common/Select';
import Button from '../../../components/common/Button';
import { ROLES, ROLE_LABELS } from '../../../constants/roles';
import { isValidEmail } from '../../../utils/validationUtils';

const ROLE_OPTIONS = Object.values(ROLES).map((role) => ({
  value: role,
  label: ROLE_LABELS[role],
}));

export const InviteUserForm = ({ onSubmit, isSubmitting = false }) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState(ROLES.STUDENT);
  const [error, setError] = useState(null);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!isValidEmail(email)) {
      setError('Enter a valid email address');
      return;
    }
    setError(null);
    onSubmit?.({ email: email.trim(), roles: [role] });
    setEmail('');
  };

  return (
    <form onSubmit={handleSubmit} className="u-flex u-gap-3 u-wrap u-items-center">
      <Input
        label="Email"
        type="email"
        value={email}
        error={error}
        onChange={(event) => setEmail(event.target.value)}
      />
      <Select
        label="Role"
        options={ROLE_OPTIONS}
        placeholder=""
        value={role}
        onChange={(event) => setRole(event.target.value)}
      />
      <Button type="submit" isLoading={isSubmitting}>
        Send invitation
      </Button>
    </form>
  );
};

export default InviteUserForm;
