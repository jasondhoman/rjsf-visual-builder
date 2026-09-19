import type { BuilderPreset } from '../types'

export const arraysAndNestingPreset: BuilderPreset = {
  id: 'arrays-and-nesting',
  name: 'Arrays & Nested Objects',
  description: 'Demonstrates nested objects and an array of objects.',
  document: {
    schema: {
      title: 'Team Roster',
      type: 'object',
      required: ['teamName'],
      properties: {
        teamName: { type: 'string', title: 'Team name' },
        address: {
          type: 'object',
          title: 'Address',
          properties: {
            street: { type: 'string', title: 'Street' },
            city: { type: 'string', title: 'City' },
            zip: { type: 'string', title: 'ZIP code' },
          },
        },
        members: {
          type: 'array',
          title: 'Members',
          items: {
            type: 'object',
            required: ['name'],
            properties: {
              name: { type: 'string', title: 'Name' },
              role: {
                type: 'string',
                title: 'Role',
                enum: ['Engineer', 'Designer', 'Manager'],
              },
            },
          },
        },
      },
    },
    uiSchema: {
      members: {
        'ui:options': {
          orderable: true,
        },
      },
    },
    formData: {
      teamName: 'Platform Team',
      members: [{ name: 'Grace Hopper', role: 'Engineer' }],
    },
  },
}
