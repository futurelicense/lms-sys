import Checkbox from '../../../components/common/Checkbox';
import { PERMISSIONS } from '../../../constants/permissions';

const GROUPS = Object.values(PERMISSIONS).reduce((acc, permission) => {
  const [resource] = permission.split(':');
  acc[resource] = acc[resource] ? [...acc[resource], permission] : [permission];
  return acc;
}, {});

/** Grid of resource x action toggles used when editing a role. */
export const PermissionMatrix = ({ value = [], onChange, readOnly = false }) => {
  const toggle = (permission, checked) =>
    onChange(checked ? [...value, permission] : value.filter((item) => item !== permission));

  return (
    <div className="u-flex-col u-gap-4">
      {Object.entries(GROUPS).map(([resource, permissions]) => (
        <fieldset key={resource} style={{ border: 0, padding: 0, margin: 0 }}>
          <legend className="u-text-sm">{resource.toUpperCase()}</legend>
          <div className="u-flex u-gap-4 u-wrap">
            {permissions.map((permission) => (
              <Checkbox
                key={permission}
                label={permission.split(':')[1]}
                checked={value.includes(permission)}
                disabled={readOnly}
                onChange={(event) => toggle(permission, event.target.checked)}
              />
            ))}
          </div>
        </fieldset>
      ))}
    </div>
  );
};

export default PermissionMatrix;
