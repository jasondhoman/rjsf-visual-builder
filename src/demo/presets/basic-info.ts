import type { BuilderPreset } from '../types'

export const basicInfoPreset: BuilderPreset = {
  id: 'basic-info',
  name: 'Basic Information',
  description: 'A simple form with text, number, and enum fields.',
  document: {
    schema: {
      title: 'Basic Information',
      description: 'A simple form example.',
      type: 'object',
      required: ['firstName', 'lastName'],
      properties: {
        firstName: { type: 'string', title: 'First name', minLength: 1 },
        lastName: { type: 'string', title: 'Last name', minLength: 1 },
        age: { type: 'integer', title: 'Age', minimum: 0 },
        bio: { type: 'string', title: 'Bio' },
        favoriteColor: {
          type: 'string',
          title: 'Favorite color',
          enum: ['red', 'green', 'blue'],
        },
        subscribe: {
          type: 'boolean',
          title: 'Subscribe to newsletter',
          default: false,
        },
      },
    },
    uiSchema: {
      bio: {
        'ui:widget': 'textarea',
      },
      'ui:submitButtonOptions': {
        submitText: 'Save',
      },
    },
    formData: {
      firstName: 'Ada',
      lastName: 'Lovelace',
    },
  },
}
