import Input from '../../../components/common/Input';
import Select from '../../../components/common/Select';
import Button from '../../../components/common/Button';
import Card from '../../../components/common/Card';
import { QUESTION_TYPES, QUESTION_TYPE_OPTIONS } from '../constants/assessmentConstants';

/** Controlled editor for an assessment's question list. */
export const QuestionBuilder = ({ questions = [], onChange }) => {
  const update = (index, patch) =>
    onChange(questions.map((question, i) => (i === index ? { ...question, ...patch } : question)));

  const add = () =>
    onChange([
      ...questions,
      {
        id: `new-${questions.length}`,
        text: '',
        type: QUESTION_TYPES.SINGLE_CHOICE,
        options: [],
        points: 1,
      },
    ]);

  const remove = (index) => onChange(questions.filter((_, i) => i !== index));

  return (
    <div className="u-flex-col u-gap-4">
      {questions.map((question, index) => (
        <Card
          key={question.id}
          title={`Question ${index + 1}`}
          actions={
            <Button variant="ghost" size="sm" onClick={() => remove(index)}>
              Remove
            </Button>
          }
        >
          <Input
            label="Question"
            value={question.text}
            onChange={(event) => update(index, { text: event.target.value })}
          />
          <div className="u-flex u-gap-3 u-mt-2">
            <Select
              label="Type"
              options={QUESTION_TYPE_OPTIONS}
              placeholder=""
              value={question.type}
              onChange={(event) => update(index, { type: event.target.value })}
            />
            <Input
              label="Points"
              type="number"
              min={1}
              value={question.points}
              onChange={(event) => update(index, { points: Number(event.target.value) })}
            />
          </div>
        </Card>
      ))}
      <Button variant="secondary" onClick={add}>
        Add question
      </Button>
    </div>
  );
};

export default QuestionBuilder;
