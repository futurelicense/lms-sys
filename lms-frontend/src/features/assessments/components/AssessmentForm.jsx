import { useState } from 'react';
import Input from '../../../components/common/Input';
import TextArea from '../../../components/common/TextArea';
import Button from '../../../components/common/Button';
import QuestionBuilder from './QuestionBuilder';

const EMPTY = { title: '', description: '', timeLimitMinutes: 30, passingScore: 70, questions: [] };

export const AssessmentForm = ({ defaultValues = EMPTY, onSubmit, onCancel }) => {
  const [values, setValues] = useState(defaultValues);
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
        label="Title"
        required
        value={values.title}
        onChange={(e) => patch({ title: e.target.value })}
      />
      <TextArea
        label="Description"
        value={values.description}
        onChange={(e) => patch({ description: e.target.value })}
      />
      <div className="u-flex u-gap-3">
        <Input
          label="Time limit (minutes)"
          type="number"
          min={1}
          value={values.timeLimitMinutes}
          onChange={(e) => patch({ timeLimitMinutes: Number(e.target.value) })}
        />
        <Input
          label="Passing score (%)"
          type="number"
          min={1}
          max={100}
          value={values.passingScore}
          onChange={(e) => patch({ passingScore: Number(e.target.value) })}
        />
      </div>

      <QuestionBuilder
        questions={values.questions}
        onChange={(questions) => patch({ questions })}
      />

      <div className="u-flex u-gap-2">
        <Button type="submit">Save assessment</Button>
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
};

export default AssessmentForm;
