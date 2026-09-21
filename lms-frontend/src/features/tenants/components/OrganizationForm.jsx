import { useState } from 'react';
import Input from '../../../components/common/Input';
import TextArea from '../../../components/common/TextArea';
import Button from '../../../components/common/Button';

export const OrganizationForm = ({ defaultValues = {}, onSubmit, isSubmitting = false }) => {
  const [values, setValues] = useState({
    name: defaultValues.name ?? '',
    domain: defaultValues.domain ?? '',
    supportEmail: defaultValues.supportEmail ?? '',
    description: defaultValues.description ?? '',
  });

  const patch = (changes) => setValues((current) => ({ ...current, ...changes }));

  return (
    <form
      className="u-flex-col u-gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit?.(values);
      }}
    >
      <Input
        label="Organisation name"
        required
        value={values.name}
        onChange={(e) => patch({ name: e.target.value })}
      />
      <Input
        label="Primary domain"
        value={values.domain}
        onChange={(e) => patch({ domain: e.target.value })}
      />
      <Input
        label="Support email"
        type="email"
        value={values.supportEmail}
        onChange={(e) => patch({ supportEmail: e.target.value })}
      />
      <TextArea
        label="Description"
        value={values.description}
        onChange={(e) => patch({ description: e.target.value })}
      />
      <Button type="submit" isLoading={isSubmitting}>
        Save organisation
      </Button>
    </form>
  );
};

export default OrganizationForm;
