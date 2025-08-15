#!/usr/bin/env python3

# Script to modify BaseModal.tsx report type container layout
# to match the width structure of enemy/friendly player containers

import re

# Read the current file
with open('client/src/components/BaseModal.tsx', 'r') as f:
    content = f.read()

# Find the report type container section and replace it
old_pattern = r'      <div className="flex gap-4 items-end mb-4">\s*<div className="flex-1">\s*<label className="block text-sm font-medium mb-1 text-gray-200">Report Type</label>(.*?)</div>\s*<div>\s*<label className="block text-sm font-medium mb-1 text-gray-200">Time</label>(.*?)</div>\s*</div>'

new_structure = '''      <div className="flex gap-3 mb-4">
        <div className="flex-1 flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1 text-gray-200">Report Type</label>\\1</div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-200">Time</label>\\2</div>
        </div>
        <div className="flex-1">
          {/* Empty space to match friendly players width */}
        </div>
      </div>'''

# Replace the pattern
modified_content = re.sub(old_pattern, new_structure, content, flags=re.DOTALL)

# Write the modified content back
with open('client/src/components/BaseModal.tsx', 'w') as f:
    f.write(modified_content)

print("Layout modification completed successfully!")