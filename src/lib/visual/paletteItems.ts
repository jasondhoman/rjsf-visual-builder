import {
  AlignLeft,
  Calendar,
  CalendarClock,
  CheckSquare,
  FolderTree,
  GitBranch,
  Hash,
  ListChecks,
  ListOrdered,
  Mail,
  SquareStack,
  Type,
  type LucideIcon,
} from 'lucide-react'
import { makeId } from './reducer'
import type { FieldNode } from './types'

export type PaletteKind =
  | 'text'
  | 'textarea'
  | 'number'
  | 'integer'
  | 'checkbox'
  | 'select'
  | 'multiselect'
  | 'date'
  | 'datetime'
  | 'email'
  | 'object'
  | 'array'
  | 'oneOf'
  | 'anyOf'

export interface PaletteDefinition {
  kind: PaletteKind
  label: string
  hint: string
  icon: LucideIcon
  create: () => FieldNode
}

function baseNode(title: string) {
  return { id: makeId(), key: 'field', title, required: false }
}

export const paletteDefinitions: PaletteDefinition[] = [
  {
    kind: 'text',
    label: 'Text',
    hint: 'Single-line string',
    icon: Type,
    create: () => ({ ...baseNode('Text field'), kind: 'field', fieldType: 'string' }),
  },
  {
    kind: 'textarea',
    label: 'Textarea',
    hint: 'Multi-line string',
    icon: AlignLeft,
    create: () => ({ ...baseNode('Textarea field'), kind: 'field', fieldType: 'string', widget: 'textarea' }),
  },
  {
    kind: 'number',
    label: 'Number',
    hint: 'Decimal number',
    icon: Hash,
    create: () => ({ ...baseNode('Number field'), kind: 'field', fieldType: 'number' }),
  },
  {
    kind: 'integer',
    label: 'Integer',
    hint: 'Whole number',
    icon: Hash,
    create: () => ({ ...baseNode('Integer field'), kind: 'field', fieldType: 'integer' }),
  },
  {
    kind: 'checkbox',
    label: 'Checkbox',
    hint: 'Boolean toggle',
    icon: CheckSquare,
    create: () => ({ ...baseNode('Checkbox field'), kind: 'field', fieldType: 'boolean', default: false }),
  },
  {
    kind: 'select',
    label: 'Select',
    hint: 'Single choice from a list',
    icon: ListChecks,
    create: () => ({
      ...baseNode('Select field'),
      kind: 'field',
      fieldType: 'string',
      enumOptions: ['Option 1', 'Option 2'],
    }),
  },
  {
    kind: 'multiselect',
    label: 'Multi-select',
    hint: 'Multiple choices (checkboxes)',
    icon: SquareStack,
    create: () => ({ ...baseNode('Multi-select field'), kind: 'multiselect', enumOptions: ['Option 1', 'Option 2'] }),
  },
  {
    kind: 'date',
    label: 'Date',
    hint: 'Date picker',
    icon: Calendar,
    create: () => ({ ...baseNode('Date field'), kind: 'field', fieldType: 'string', format: 'date' }),
  },
  {
    kind: 'datetime',
    label: 'Date & time',
    hint: 'Date and time picker',
    icon: CalendarClock,
    create: () => ({ ...baseNode('Date & time field'), kind: 'field', fieldType: 'string', format: 'date-time' }),
  },
  {
    kind: 'email',
    label: 'Email',
    hint: 'Email-formatted string',
    icon: Mail,
    create: () => ({ ...baseNode('Email field'), kind: 'field', fieldType: 'string', format: 'email' }),
  },
  {
    kind: 'object',
    label: 'Group',
    hint: 'Nested object with its own fields',
    icon: FolderTree,
    create: () => ({ ...baseNode('Group'), kind: 'object', children: [] }),
  },
  {
    kind: 'array',
    label: 'List',
    hint: 'Repeatable array of one field type',
    icon: ListOrdered,
    create: () => ({
      ...baseNode('List'),
      kind: 'array',
      itemNode: { id: makeId(), key: 'item', title: 'Item', required: false, kind: 'field', fieldType: 'string' },
    }),
  },
  {
    kind: 'oneOf',
    label: 'Conditional (oneOf)',
    hint: 'Value must match exactly one of several shapes',
    icon: GitBranch,
    create: () => ({
      ...baseNode('Conditional field'),
      kind: 'oneOf',
      branches: [
        { id: makeId(), title: 'Option 1', children: [] },
        { id: makeId(), title: 'Option 2', children: [] },
      ],
    }),
  },
  {
    kind: 'anyOf',
    label: 'Conditional (anyOf)',
    hint: 'Value must match at least one of several shapes',
    icon: GitBranch,
    create: () => ({
      ...baseNode('Conditional field'),
      kind: 'anyOf',
      branches: [
        { id: makeId(), title: 'Option 1', children: [] },
        { id: makeId(), title: 'Option 2', children: [] },
      ],
    }),
  },
]
