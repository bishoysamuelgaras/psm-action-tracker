# Project-wide mixed Arabic/English text display fix

This update applies the same Bidi handling used in Actions across the rest of the project UI.

## Updated areas
- Sources register and mobile cards
- Recommendations register, snapshots, active source filter, and Magic AI preview
- Dashboard urgent queue, upcoming actions, profile info, workload, and departments
- Reports summary, source progress, source badges, and printable full source report
- Logs activity register and details chips
- Master data registers
- Users, departments, roles, messages, and permission matrix
- Header/sidebar signed-in user information
- Global input/textarea/select alignment for `dir="auto"`

## Technical approach
- Dynamic text that may contain Arabic + English is rendered using BidiText/BidiBlock.
- Codes and reference numbers are isolated with BidiCode where applicable.
- Inputs, textareas, and selects now use start alignment for better RTL/LTR behavior.
- No Supabase logic, save logic, filters, or permissions were changed.
