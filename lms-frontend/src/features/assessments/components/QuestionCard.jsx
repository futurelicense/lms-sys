import Card from '../../../components/common/Card';
import Radio from '../../../components/common/Radio';
import Checkbox from '../../../components/common/Checkbox';
import TextArea from '../../../components/common/TextArea';
import { QUESTION_TYPES } from '../constants/assessmentConstants';

export const QuestionCard = ({ question, index, value, onChange }) => (
  <Card title={`Question ${index + 1}`}>
    <p className="u-mb-4">{question.text}</p>

    {question.type === QUESTION_TYPES.SINGLE_CHOICE && (
      <Radio
        name={question.id}
        options={question.options.map((option) => ({ value: option.id, label: option.text }))}
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value)}
      />
    )}

    {question.type === QUESTION_TYPES.MULTIPLE_CHOICE &&
      question.options.map((option) => (
        <Checkbox
          key={option.id}
          label={option.text}
          checked={(value ?? []).includes(option.id)}
          onChange={(event) =>
            onChange(
              event.target.checked
                ? [...(value ?? []), option.id]
                : (value ?? []).filter((id) => id !== option.id),
            )
          }
        />
      ))}

    {question.type === QUESTION_TYPES.FREE_TEXT && (
      <TextArea
        label="Your answer"
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value)}
      />
    )}
  </Card>
);

export default QuestionCard;
