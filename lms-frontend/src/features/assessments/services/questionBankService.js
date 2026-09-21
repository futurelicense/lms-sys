/**
 * Question Bank Service
 * 
 * Provides curated, industry-standard questions (Algorithms, Data Structures,
 * Web Dev, System Design, OOP) and allows instructors to save, search, filter,
 * and import questions across assessments.
 */

const STORAGE_KEY = 'lms_custom_question_bank';

export const QUESTION_CATEGORIES = [
  { id: 'all', label: 'All Topics' },
  { id: 'algorithms', label: 'Algorithms & Logic' },
  { id: 'data-structures', label: 'Data Structures' },
  { id: 'web-dev', label: 'Full-Stack & Web Dev' },
  { id: 'oop', label: 'OOP & Architecture' },
  { id: 'math', label: 'Math & Numbers' },
];

const DEFAULT_QUESTION_BANK = [
  {
    id: 'qb-1',
    title: 'Two Sum Target Finder',
    category: 'algorithms',
    difficulty: 'EASY',
    questionType: 'CODING',
    compiler: 'ALL',
    marks: 10,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ['Arrays', 'Hash Table', 'Algorithms'],
    description: `Given an array of integers \`nums\` and an integer \`target\`, return the indices of the two numbers such that they add up to \`target\`.

Assume each input has exactly one solution, and you may not use the same element twice. Output indices space-separated.`,
    inputFormat: 'First line: space-separated integers for nums. Second line: integer target.',
    outputFormat: 'Space-separated pair of indices (e.g. "0 1").',
    constraints: '2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\n-10^9 <= target <= 10^9',
    testCases: [
      { inputData: '2 7 11 15\n9', expectedOutput: '0 1', sample: true, hidden: false, weight: 1 },
      { inputData: '3 2 4\n6', expectedOutput: '1 2', sample: true, hidden: false, weight: 1 },
      { inputData: '3 3\n6', expectedOutput: '0 1', sample: false, hidden: true, weight: 2 },
      { inputData: '1 5 8 12 19 25\n27', expectedOutput: '2 4', sample: false, hidden: true, weight: 2 },
    ],
    options: [],
  },
  {
    id: 'qb-2',
    title: 'Valid Palindrome String Checker',
    category: 'algorithms',
    difficulty: 'EASY',
    questionType: 'CODING',
    compiler: 'ALL',
    marks: 10,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ['Strings', 'Two Pointers'],
    description: `A phrase is a **palindrome** if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward.

Write a program that reads a line of text and prints \`true\` if it is a palindrome, or \`false\` otherwise.`,
    inputFormat: 'Single line containing the candidate string.',
    outputFormat: 'Print "true" or "false".',
    constraints: '1 <= s.length <= 2 * 10^5\ns consists only of printable ASCII characters.',
    testCases: [
      { inputData: 'A man, a plan, a canal: Panama', expectedOutput: 'true', sample: true, hidden: false, weight: 1 },
      { inputData: 'race a car', expectedOutput: 'false', sample: true, hidden: false, weight: 1 },
      { inputData: ' ', expectedOutput: 'true', sample: false, hidden: true, weight: 1 },
      { inputData: '0P', expectedOutput: 'false', sample: false, hidden: true, weight: 2 },
    ],
    options: [],
  },
  {
    id: 'qb-3',
    title: 'Reverse Linked List Order',
    category: 'data-structures',
    difficulty: 'MEDIUM',
    questionType: 'CODING',
    compiler: 'ALL',
    marks: 15,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ['Linked List', 'Recursion', 'Pointers'],
    description: `Given a sequence of integers representing the nodes of a singly-linked list, reverse the list and print the reversed elements space-separated.`,
    inputFormat: 'Space-separated integers representing node values.',
    outputFormat: 'Space-separated integers in reversed order.',
    constraints: 'The number of nodes in the list is in the range [0, 5000].\n-5000 <= Node.val <= 5000',
    testCases: [
      { inputData: '1 2 3 4 5', expectedOutput: '5 4 3 2 1', sample: true, hidden: false, weight: 1 },
      { inputData: '1 2', expectedOutput: '2 1', sample: true, hidden: false, weight: 1 },
      { inputData: '42', expectedOutput: '42', sample: false, hidden: true, weight: 1 },
      { inputData: '10 20 30 40 50 60', expectedOutput: '60 50 40 30 20 10', sample: false, hidden: true, weight: 2 },
    ],
    options: [],
  },
  {
    id: 'qb-4',
    title: 'Valid Parentheses & Bracket Matching',
    category: 'data-structures',
    difficulty: 'MEDIUM',
    questionType: 'CODING',
    compiler: 'ALL',
    marks: 15,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ['Stack', 'Strings'],
    description: `Given a string \`s\` containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.

Print \`true\` or \`false\`.`,
    inputFormat: 'Single string s.',
    outputFormat: 'true or false.',
    constraints: '1 <= s.length <= 10^4\ns consists of parentheses only "()[]{}".',
    testCases: [
      { inputData: '()[]{}', expectedOutput: 'true', sample: true, hidden: false, weight: 1 },
      { inputData: '(]', expectedOutput: 'false', sample: true, hidden: false, weight: 1 },
      { inputData: '([{}])', expectedOutput: 'true', sample: false, hidden: true, weight: 2 },
      { inputData: '(((())))', expectedOutput: 'true', sample: false, hidden: true, weight: 1 },
    ],
    options: [],
  },
  {
    id: 'qb-5',
    title: 'Time Complexity of Binary Search',
    category: 'algorithms',
    difficulty: 'EASY',
    questionType: 'MULTIPLE_CHOICE',
    compiler: 'ALL',
    marks: 5,
    timeLimitMs: 1000,
    memoryLimitMb: 64,
    tags: ['Algorithms', 'Complexity', 'MCQ'],
    description: `What is the worst-case and average-case time complexity of Binary Search on a sorted array of size \`n\`?`,
    inputFormat: '',
    outputFormat: '',
    constraints: '',
    testCases: [],
    options: [
      { optionText: 'O(n)', isCorrect: false, explanation: 'Linear search is O(n), binary search halves search space each iteration.' },
      { optionText: 'O(log n)', isCorrect: true, explanation: 'Binary search repeatedly divides the search space in half, resulting in logarithmic O(log n) time.' },
      { optionText: 'O(n log n)', isCorrect: false, explanation: 'O(n log n) is typical for optimal comparison sorts like Merge Sort.' },
      { optionText: 'O(1)', isCorrect: false, explanation: 'Hash table lookups can be O(1), but binary search is O(log n).' },
    ],
  },
  {
    id: 'qb-6',
    title: 'HTTP Status Codes: Idempotent PUT vs POST',
    category: 'web-dev',
    difficulty: 'MEDIUM',
    questionType: 'MULTIPLE_CHOICE',
    compiler: 'ALL',
    marks: 5,
    timeLimitMs: 1000,
    memoryLimitMb: 64,
    tags: ['REST API', 'HTTP', 'Web Architecture'],
    description: `According to the RFC 7231 HTTP/1.1 specification, what is the key architectural difference regarding idempotency between the HTTP \`PUT\` and \`POST\` methods?`,
    inputFormat: '',
    outputFormat: '',
    constraints: '',
    testCases: [],
    options: [
      { optionText: 'PUT is idempotent while POST is not idempotent.', isCorrect: true, explanation: 'Calling PUT multiple times with the same payload results in the exact same server state, whereas POST creates new side effects.' },
      { optionText: 'POST is idempotent while PUT is not.', isCorrect: false, explanation: 'POST is non-idempotent by definition.' },
      { optionText: 'Both PUT and POST are strictly idempotent.', isCorrect: false, explanation: 'POST is explicitly not idempotent.' },
      { optionText: 'Neither PUT nor POST is idempotent.', isCorrect: false, explanation: 'PUT is guaranteed to be idempotent.' },
    ],
  },
  {
    id: 'qb-7',
    title: 'SOLID Principles: Liskov Substitution Principle',
    category: 'oop',
    difficulty: 'HARD',
    questionType: 'MULTIPLE_CHOICE',
    compiler: 'ALL',
    marks: 5,
    timeLimitMs: 1000,
    memoryLimitMb: 64,
    tags: ['OOP', 'Design Patterns', 'Architecture'],
    description: `Which of the following scenarios constitutes a direct violation of the **Liskov Substitution Principle (LSP)**?`,
    inputFormat: '',
    outputFormat: '',
    constraints: '',
    testCases: [],
    options: [
      { optionText: 'A subclass Square extending Rectangle throws an UnsupportedOperationException when setHeight is called separately from setWidth.', isCorrect: true, explanation: 'If a client expecting a Rectangle cannot safely substitute a Square without altering correctness, LSP is violated.' },
      { optionText: 'A subclass overrides a parent method and returns a subtype of the parent return type (covariance).', isCorrect: false, explanation: 'Return type covariance is fully allowed and adheres to LSP.' },
      { optionText: 'A class implements multiple interfaces with single responsibilities.', isCorrect: false, explanation: 'This describes the Interface Segregation Principle.' },
      { optionText: 'A class depends upon abstractions rather than concrete classes.', isCorrect: false, explanation: 'This describes Dependency Inversion Principle.' },
    ],
  },
  {
    id: 'qb-8',
    title: 'Fibonacci Sequence Generator',
    category: 'math',
    difficulty: 'EASY',
    questionType: 'CODING',
    compiler: 'ALL',
    marks: 10,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ['Recursion', 'Math', 'Dynamic Programming'],
    description: `Given an integer \`n\`, calculate the \`n\`-th Fibonacci number, where F(0) = 0, F(1) = 1, and F(n) = F(n-1) + F(n-2) for n > 1.`,
    inputFormat: 'Single integer n.',
    outputFormat: 'Value of F(n).',
    constraints: '0 <= n <= 30',
    testCases: [
      { inputData: '2', expectedOutput: '1', sample: true, hidden: false, weight: 1 },
      { inputData: '3', expectedOutput: '2', sample: true, hidden: false, weight: 1 },
      { inputData: '4', expectedOutput: '3', sample: true, hidden: false, weight: 1 },
      { inputData: '10', expectedOutput: '55', sample: false, hidden: true, weight: 2 },
    ],
    options: [],
  },
];

function getStoredCustomQuestions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCustomQuestions(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }
}

export const questionBankService = {
  /**
   * List all questions with optional filters
   */
  getQuestions: async ({ category = 'all', difficulty, type, search } = {}) => {
    // Artificial small delay to simulate network async
    await new Promise((r) => setTimeout(r, 80));

    const custom = getStoredCustomQuestions();
    let all = [...custom, ...DEFAULT_QUESTION_BANK];

    if (category && category !== 'all') {
      all = all.filter((q) => q.category === category);
    }
    if (difficulty && difficulty !== 'ALL') {
      all = all.filter((q) => q.difficulty === difficulty);
    }
    if (type && type !== 'ALL') {
      all = all.filter((q) => q.questionType === type);
    }
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      all = all.filter((item) =>
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        (item.tags && item.tags.some((t) => t.toLowerCase().includes(q)))
      );
    }

    return all;
  },

  /**
   * Get question by ID
   */
  getQuestionById: async (id) => {
    const custom = getStoredCustomQuestions();
    const all = [...custom, ...DEFAULT_QUESTION_BANK];
    return all.find((q) => q.id === id) || null;
  },

  /**
   * Add a custom question template to user's question bank
   */
  saveToBank: async (question) => {
    const custom = getStoredCustomQuestions();
    const newEntry = {
      ...question,
      id: `custom-qb-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      isCustom: true,
      createdAt: new Date().toISOString(),
    };
    custom.unshift(newEntry);
    saveCustomQuestions(custom);
    return newEntry;
  },

  /**
   * Save a batch of questions to user's question bank
   */
  saveBatchToBank: async (questionsList) => {
    const custom = getStoredCustomQuestions();
    const now = Date.now();
    const newEntries = questionsList.map((q, idx) => ({
      ...q,
      id: q.id && !String(q.id).startsWith('qb-') ? q.id : `custom-qb-${now}-${idx}`,
      isCustom: true,
      createdAt: new Date().toISOString(),
    }));
    const updated = [...newEntries, ...custom];
    saveCustomQuestions(updated);
    return newEntries;
  },

  /**
   * Delete a custom question template
   */
  deleteFromBank: async (id) => {
    const custom = getStoredCustomQuestions();
    const filtered = custom.filter((q) => q.id !== id);
    saveCustomQuestions(filtered);
    return true;
  },

  /**
   * Export questions to JSON and trigger file download
   */
  exportToJson: (questions, filename = `questions-export-${new Date().toISOString().slice(0, 10)}.json`) => {
    const jsonStr = JSON.stringify(questions, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
    downloadBlob(blob, filename);
  },

  /**
   * Export questions to CSV and trigger file download
   */
  exportToCsv: (questions, filename = `questions-export-${new Date().toISOString().slice(0, 10)}.csv`) => {
    const headers = [
      'title', 'questionType', 'difficulty', 'marks', 'category', 'tags',
      'timeLimitMs', 'memoryLimitMb', 'description', 'inputFormat', 'outputFormat',
      'constraints', 'testCases', 'options'
    ];

    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '""';
      let str = typeof val === 'object' ? JSON.stringify(val) : String(val);
      str = str.replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = [headers.join(',')];
    for (const q of questions) {
      const row = [
        escapeCsv(q.title || ''),
        escapeCsv(q.questionType || 'CODING'),
        escapeCsv(q.difficulty || 'MEDIUM'),
        escapeCsv(q.marks || 10),
        escapeCsv(q.category || 'algorithms'),
        escapeCsv(Array.isArray(q.tags) ? q.tags.join(';') : (q.tags || '')),
        escapeCsv(q.timeLimitMs || 2000),
        escapeCsv(q.memoryLimitMb || 256),
        escapeCsv(q.description || ''),
        escapeCsv(q.inputFormat || ''),
        escapeCsv(q.outputFormat || ''),
        escapeCsv(q.constraints || ''),
        escapeCsv(q.testCases || []),
        escapeCsv(q.options || []),
      ];
      rows.push(row.join(','));
    }

    const csvContent = rows.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, filename);
  },

  /**
   * Returns sample JSON template
   */
  getSampleJsonTemplate: () => {
    return [
      {
        title: "Two Sum Problem",
        questionType: "CODING",
        difficulty: "EASY",
        marks: 10,
        category: "algorithms",
        tags: ["Arrays", "Hash Table"],
        timeLimitMs: 2000,
        memoryLimitMb: 256,
        description: "Given an array of integers `nums` and integer `target`, return indices of two numbers adding to `target`.",
        inputFormat: "First line: space-separated integers. Second line: integer target.",
        outputFormat: "Two space-separated indices.",
        constraints: "2 <= nums.length <= 10^4",
        testCases: [
          { inputData: "2 7 11 15\n9", expectedOutput: "0 1", sample: true, hidden: false, weight: 1 },
          { inputData: "3 2 4\n6", expectedOutput: "1 2", sample: false, hidden: true, weight: 2 }
        ],
        options: []
      },
      {
        title: "HTTP Status Codes - Resource Created",
        questionType: "MULTIPLE_CHOICE",
        difficulty: "EASY",
        marks: 5,
        category: "web-dev",
        tags: ["HTTP", "REST", "Networking"],
        description: "Which HTTP status code signifies that a new resource has been successfully created?",
        inputFormat: "",
        outputFormat: "",
        constraints: "",
        testCases: [],
        options: [
          { optionText: "200 OK", isCorrect: false, explanation: "Standard success response" },
          { optionText: "201 Created", isCorrect: true, explanation: "Indicates resource creation success" },
          { optionText: "204 No Content", isCorrect: false, explanation: "Action succeeded with no body" },
          { optionText: "400 Bad Request", isCorrect: false, explanation: "Client-side error code" }
        ]
      }
    ];
  },

  /**
   * Returns sample CSV string
   */
  getSampleCsvTemplate: () => {
    const sample = questionBankService.getSampleJsonTemplate();
    const headers = [
      'title', 'questionType', 'difficulty', 'marks', 'category', 'tags',
      'timeLimitMs', 'memoryLimitMb', 'description', 'inputFormat', 'outputFormat',
      'constraints', 'testCases', 'options'
    ];

    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '""';
      let str = typeof val === 'object' ? JSON.stringify(val) : String(val);
      str = str.replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = [headers.join(',')];
    for (const q of sample) {
      rows.push([
        escapeCsv(q.title),
        escapeCsv(q.questionType),
        escapeCsv(q.difficulty),
        escapeCsv(q.marks),
        escapeCsv(q.category),
        escapeCsv(q.tags.join(';')),
        escapeCsv(q.timeLimitMs),
        escapeCsv(q.memoryLimitMb),
        escapeCsv(q.description),
        escapeCsv(q.inputFormat),
        escapeCsv(q.outputFormat),
        escapeCsv(q.constraints),
        escapeCsv(q.testCases),
        escapeCsv(q.options),
      ].join(','));
    }
    return rows.join('\r\n');
  },

  /**
   * Parse an uploaded JSON or CSV file into validated question objects
   */
  parseImportFile: async (file) => {
    const content = await file.text();
    const isJson = file.name.toLowerCase().endsWith('.json') || content.trim().startsWith('[');

    if (isJson) {
      return parseJsonQuestions(content);
    } else {
      return parseCsvQuestions(content);
    }
  },
};

/** Browser file download trigger */
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/** Parse and validate JSON file content */
function parseJsonQuestions(content) {
  const errors = [];
  const validQuestions = [];

  let rawList;
  try {
    rawList = JSON.parse(content);
    if (!Array.isArray(rawList)) {
      rawList = [rawList];
    }
  } catch (err) {
    return {
      questions: [],
      errors: [{ index: 0, title: 'JSON Syntax', reason: 'Invalid JSON file: ' + err.message }]
    };
  }

  rawList.forEach((item, idx) => {
    const validation = validateAndNormalizeQuestion(item, idx + 1);
    if (validation.valid) {
      validQuestions.push(validation.question);
    } else {
      errors.push({ index: idx + 1, title: item.title || `Item #${idx + 1}`, reason: validation.reason });
    }
  });

  return { questions: validQuestions, errors };
}

/** Parse and validate CSV file content */
function parseCsvQuestions(content) {
  const errors = [];
  const validQuestions = [];

  const lines = parseCsvLines(content);
  if (lines.length < 2) {
    return {
      questions: [],
      errors: [{ index: 0, title: 'CSV Structure', reason: 'CSV must contain a header row and at least one question row' }]
    };
  }

  const headers = lines[0].map(h => h.trim());
  const headerMap = {};
  headers.forEach((h, i) => {
    headerMap[h.toLowerCase()] = i;
  });

  if (headerMap['title'] === undefined) {
    return {
      questions: [],
      errors: [{ index: 0, title: 'CSV Headers', reason: 'Required header "title" is missing from CSV' }]
    };
  }

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i];
    if (row.length === 0 || (row.length === 1 && !row[0].trim())) continue; // Skip blank line

    const getCol = (name) => {
      const idx = headerMap[name.toLowerCase()];
      return idx !== undefined && row[idx] !== undefined ? row[idx].trim() : '';
    };

    let tags = [];
    const rawTags = getCol('tags');
    if (rawTags) {
      tags = rawTags.includes(';') ? rawTags.split(';').map(t => t.trim()) : rawTags.split(',').map(t => t.trim());
    }

    let testCases = [];
    const rawTestCases = getCol('testcases');
    if (rawTestCases) {
      try {
        testCases = JSON.parse(rawTestCases);
      } catch {
        testCases = [];
      }
    }

    let options = [];
    const rawOptions = getCol('options');
    if (rawOptions) {
      try {
        options = JSON.parse(rawOptions);
      } catch {
        options = [];
      }
    }

    const rawItem = {
      title: getCol('title'),
      questionType: getCol('questiontype') || 'CODING',
      difficulty: getCol('difficulty') || 'MEDIUM',
      marks: parseInt(getCol('marks')) || 10,
      category: getCol('category') || 'algorithms',
      tags,
      timeLimitMs: parseInt(getCol('timelimitms')) || 2000,
      memoryLimitMb: parseInt(getCol('memorylimitmb')) || 256,
      description: getCol('description'),
      inputFormat: getCol('inputformat'),
      outputFormat: getCol('outputformat'),
      constraints: getCol('constraints'),
      testCases,
      options,
    };

    const validation = validateAndNormalizeQuestion(rawItem, i);
    if (validation.valid) {
      validQuestions.push(validation.question);
    } else {
      errors.push({ index: i, title: rawItem.title || `Row #${i}`, reason: validation.reason });
    }
  }

  return { questions: validQuestions, errors };
}

/** Robust CSV text parser supporting quotes, escaped quotes, and newlines in cells */
function parseCsvLines(text) {
  const rows = [];
  let currentRow = [];
  let currentField = '';
  let inQuotes = false;
  let i = 0;

  while (i < text.length) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentField += '"';
        i += 2;
        continue;
      } else {
        inQuotes = !inQuotes;
        i++;
        continue;
      }
    }

    if (char === ',' && !inQuotes) {
      currentRow.push(currentField);
      currentField = '';
      i++;
      continue;
    }

    if ((char === '\r' || char === '\n') && !inQuotes) {
      currentRow.push(currentField);
      currentField = '';
      rows.push(currentRow);
      currentRow = [];
      if (char === '\r' && nextChar === '\n') {
        i += 2;
      } else {
        i++;
      }
      continue;
    }

    currentField += char;
    i++;
  }

  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }

  return rows;
}

/** Validate single question object & normalize properties */
function validateAndNormalizeQuestion(item, rowNum) {
  if (!item.title || !String(item.title).trim()) {
    return { valid: false, reason: 'Missing question title' };
  }

  const questionType = String(item.questionType || 'CODING').toUpperCase();
  if (questionType !== 'CODING' && questionType !== 'MULTIPLE_CHOICE') {
    return { valid: false, reason: `Invalid questionType "${item.questionType}". Must be CODING or MULTIPLE_CHOICE.` };
  }

  const difficulty = String(item.difficulty || 'MEDIUM').toUpperCase();
  const validDiffs = ['EASY', 'MEDIUM', 'HARD'];
  const normDiff = validDiffs.includes(difficulty) ? difficulty : 'MEDIUM';

  const marks = parseInt(item.marks, 10);
  if (isNaN(marks) || marks <= 0) {
    return { valid: false, reason: 'Marks must be a positive number' };
  }

  // Question type specific validation
  if (questionType === 'MULTIPLE_CHOICE') {
    if (!Array.isArray(item.options) || item.options.length < 2) {
      return { valid: false, reason: 'MULTIPLE_CHOICE question requires at least 2 options' };
    }
    const hasCorrect = item.options.some(opt => opt.isCorrect === true || String(opt.isCorrect).toLowerCase() === 'true');
    if (!hasCorrect) {
      return { valid: false, reason: 'MULTIPLE_CHOICE question must have at least one correct option' };
    }
  }

  const normalized = {
    title: String(item.title).trim(),
    questionType,
    difficulty: normDiff,
    category: item.category || 'algorithms',
    marks,
    tags: Array.isArray(item.tags) ? item.tags : [],
    timeLimitMs: parseInt(item.timeLimitMs, 10) || 2000,
    memoryLimitMb: parseInt(item.memoryLimitMb, 10) || 256,
    description: item.description || '',
    inputFormat: item.inputFormat || '',
    outputFormat: item.outputFormat || '',
    constraints: item.constraints || '',
    testCases: Array.isArray(item.testCases) ? item.testCases.map(tc => ({
      inputData: String(tc.inputData ?? ''),
      expectedOutput: String(tc.expectedOutput ?? ''),
      sample: Boolean(tc.sample),
      hidden: Boolean(tc.hidden),
      weight: parseInt(tc.weight, 10) || 1,
    })) : [],
    options: Array.isArray(item.options) ? item.options.map(opt => ({
      optionText: String(opt.optionText ?? ''),
      isCorrect: Boolean(opt.isCorrect),
      explanation: String(opt.explanation ?? ''),
    })) : [],
  };

  return { valid: true, question: normalized };
}

export default questionBankService;
