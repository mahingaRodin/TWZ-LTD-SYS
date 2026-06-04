const brand = {
  bg: '#101418',
  surface: '#1B232D',
  primary: '#D72638',
  secondary: '#F4A261',
  accent: '#2A9D8F',
  text: '#F8FAFC',
  muted: '#94A3B8',
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function detailRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:10px 16px;color:${brand.muted};font-size:11px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;vertical-align:top;width:120px;">${label}</td>
    <td style="padding:10px 16px;color:${brand.text};font-size:14px;font-weight:600;line-height:1.5;">${escapeHtml(value)}</td>
  </tr>`;
}

function layout(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width"/></head>
<body style="margin:0;padding:0;background:${brand.bg};font-family:Inter,Segoe UI,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:${brand.bg};padding:32px 16px;">
<tr><td align="center">
<table width="100%" style="max-width:560px;background:${brand.surface};border-radius:12px;border:1px solid #2D3748;overflow:hidden;">
<tr><td style="background:${brand.primary};padding:20px 24px;">
  <span style="color:#fff;font-size:18px;font-weight:700;">TWZ LTD</span>
  <span style="color:#fff9;font-size:12px;display:block;margin-top:4px;">Fire Safety Platform</span>
</td></tr>
<tr><td style="padding:28px 24px;color:${brand.text};">
  <h1 style="margin:0 0 16px;font-size:22px;color:${brand.text};">${title}</h1>
  ${bodyHtml}
</td></tr>
<tr><td style="padding:16px 24px;border-top:1px solid #2D3748;color:${brand.muted};font-size:11px;">
  Mission-critical fire extinguisher lifecycle management · TWZ Ltd
</td></tr>
</table></td></tr></table></body></html>`;
}

export function otpEmailHtml(firstName: string, code: string, minutes: number): string {
  return layout(
    'Verify your email',
    `<p style="color:${brand.muted};line-height:1.6;">Hello <strong style="color:${brand.text}">${firstName}</strong>,</p>
     <p style="color:${brand.muted};line-height:1.6;">Use this one-time code to verify your account:</p>
     <p style="text-align:center;margin:24px 0;">
       <span style="display:inline-block;background:#0b0f12;border:2px solid ${brand.primary};border-radius:8px;padding:16px 32px;font-size:28px;font-weight:700;letter-spacing:8px;color:${brand.primary};">${code}</span>
     </p>
     <p style="color:${brand.muted};font-size:13px;">Expires in ${minutes} minutes. If you did not request this, ignore this email.</p>`,
  );
}

export function passwordResetEmailHtml(
  firstName: string,
  code: string,
  minutes: number,
  resetUrl?: string,
): string {
  const safeName = escapeHtml(firstName);
  const href = resetUrl?.trim() ? escapeHtml(resetUrl.trim()) : '';
  const ctaBlock = href
    ? `<table cellpadding="0" cellspacing="0" style="margin:24px 0 8px;">
         <tr><td style="border-radius:8px;background:${brand.primary};">
           <a href="${href}" style="display:inline-block;padding:14px 28px;color:#fff;font-size:14px;font-weight:700;text-decoration:none;">Set new password</a>
         </td></tr>
       </table>
       <p style="margin:0;color:${brand.muted};font-size:12px;">Enter the code below on that page, then choose and confirm your new password.</p>`
    : `<p style="color:${brand.muted};font-size:12px;">Sign in to the portal and open the reset password page to enter this code.</p>`;

  return layout(
    'Reset your password',
    `<p style="color:${brand.muted};line-height:1.6;">Hello <strong style="color:${brand.text};">${safeName}</strong>,</p>
     <p style="color:${brand.muted};">Use the button below or enter this code on the reset page:</p>
     ${ctaBlock}
     <p style="text-align:center;margin:24px 0;">
       <span style="display:inline-block;background:#0b0f12;border:2px solid ${brand.primary};border-radius:8px;padding:16px 32px;font-size:28px;font-weight:700;letter-spacing:8px;color:${brand.primary};">${code}</span>
     </p>
     <p style="color:${brand.muted};font-size:13px;">Valid for ${minutes} minutes. If you did not request this, ignore this email.</p>`,
  );
}

export function accountCreatedEmailHtml(
  firstName: string,
  role: string,
  email: string,
  tempPassword: string,
): string {
  return layout(
    'Your TWZ account is ready',
    `<p style="color:${brand.muted};line-height:1.6;">Hello <strong>${firstName}</strong>,</p>
     <p style="color:${brand.muted};">An administrator created your <strong style="color:${brand.accent}">${role}</strong> account.</p>
     <table style="width:100%;margin:20px 0;background:#0b0f12;border-radius:8px;border:1px solid #2D3748;">
       <tr><td style="padding:12px 16px;color:${brand.muted};font-size:12px;">EMAIL</td><td style="padding:12px 16px;color:${brand.text};font-weight:600;">${email}</td></tr>
       <tr><td style="padding:12px 16px;color:${brand.muted};font-size:12px;">TEMP PASSWORD</td><td style="padding:12px 16px;color:${brand.primary};font-weight:600;">${tempPassword}</td></tr>
     </table>
     <p style="color:${brand.primary};font-size:13px;font-weight:600;">You must change this password after your first login.</p>`,
  );
}

export interface InspectionAssignedEmailOptions {
  notes?: string | null;
  assignedBy?: string | null;
  portalUrl?: string | null;
}

export function inspectionAssignedEmailPlain(
  inspectorName: string,
  serial: string,
  location: string,
  scheduledAt: string,
  options?: InspectionAssignedEmailOptions,
): string {
  const lines = [
    `Hello ${inspectorName},`,
    '',
    'You have been assigned a new field inspection by the TWZ admin team.',
    '',
    `Unit serial: ${serial}`,
    `Location: ${location}`,
    `Scheduled: ${scheduledAt}`,
  ];
  if (options?.assignedBy) lines.push(`Assigned by: ${options.assignedBy}`);
  if (options?.notes?.trim()) lines.push('', 'Notes:', options.notes.trim());
  lines.push('', 'Sign in to the Inspector Portal → My assignments to complete the visit and log maintenance.');
  return lines.join('\n');
}

export function inspectionAssignedEmailHtml(
  inspectorName: string,
  serial: string,
  location: string,
  scheduledAt: string,
  options?: InspectionAssignedEmailOptions,
): string {
  const safeName = escapeHtml(inspectorName);
  const notesBlock = options?.notes?.trim()
    ? `<div style="margin-top:20px;padding:14px 16px;background:#0b0f12;border-radius:8px;border-left:4px solid ${brand.secondary};">
         <p style="margin:0 0 6px;color:${brand.muted};font-size:11px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;">Admin notes</p>
         <p style="margin:0;color:${brand.text};font-size:14px;line-height:1.6;">${escapeHtml(options.notes.trim())}</p>
       </div>`
    : '';

  const portalHref = options?.portalUrl?.trim() ? escapeHtml(options.portalUrl.trim()) : '';
  const ctaBlock = portalHref
    ? `<table cellpadding="0" cellspacing="0" style="margin:28px 0 8px;">
         <tr><td style="border-radius:8px;background:${brand.accent};">
           <a href="${portalHref}" style="display:inline-block;padding:14px 28px;color:#fff;font-size:14px;font-weight:700;text-decoration:none;">Open Inspector Portal</a>
         </td></tr>
       </table>
       <p style="margin:0;color:${brand.muted};font-size:12px;">Go to <strong style="color:${brand.text};">My assignments</strong> to complete the inspection and record pass/fail.</p>`
    : `<div style="margin:28px 0 8px;padding:16px;background:${brand.accent}18;border:1px solid ${brand.accent}55;border-radius:8px;">
         <p style="margin:0;color:${brand.text};font-size:14px;font-weight:600;">Sign in to the Inspector Portal</p>
         <p style="margin:8px 0 0;color:${brand.muted};font-size:13px;line-height:1.5;">Open <strong style="color:${brand.accent};">My assignments</strong>, complete the visit, then log maintenance for the unit.</p>
       </div>`;

  const assignedByRow = options?.assignedBy?.trim()
    ? detailRow('Assigned by', options.assignedBy.trim())
    : '';

  return layout(
    'New field inspection assigned',
    `<p style="margin:0 0 8px;color:${brand.muted};font-size:14px;line-height:1.6;">Hello <strong style="color:${brand.text};">${safeName}</strong>,</p>
     <p style="margin:0 0 20px;color:${brand.muted};font-size:14px;line-height:1.6;">
       The operations team scheduled you for an on-site extinguisher inspection. Details are below.
     </p>
     <p style="margin:0 0 16px;text-align:center;">
       <span style="display:inline-block;background:${brand.secondary}22;color:${brand.secondary};border:1px solid ${brand.secondary};padding:6px 16px;border-radius:999px;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">New assignment</span>
     </p>
     <table style="width:100%;margin:0 0 4px;background:#0b0f12;border-radius:8px;border:1px solid #2D3748;border-collapse:collapse;">
       ${detailRow('Unit serial', serial)}
       ${detailRow('Location', location)}
       ${detailRow('Scheduled', scheduledAt)}
       ${assignedByRow}
       <tr>
         <td style="padding:10px 16px;color:${brand.muted};font-size:11px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;vertical-align:middle;">Status</td>
         <td style="padding:10px 16px;">
           <span style="display:inline-block;background:${brand.secondary}22;color:${brand.secondary};border:1px solid ${brand.secondary};padding:4px 12px;border-radius:999px;font-size:12px;font-weight:700;">Scheduled — awaiting your visit</span>
         </td>
       </tr>
     </table>
     ${notesBlock}
     <div style="margin-top:24px;padding:16px;background:#0b0f12;border-radius:8px;border:1px solid #2D3748;">
       <p style="margin:0 0 10px;color:${brand.text};font-size:13px;font-weight:600;">What to do on site</p>
       <ol style="margin:0;padding-left:20px;color:${brand.muted};font-size:13px;line-height:1.8;">
         <li>Inspect the unit and record <strong style="color:${brand.accent};">Pass</strong> or <strong style="color:${brand.primary};">Fail</strong></li>
         <li>Log maintenance actions and conditions in the portal</li>
         <li>Contact admin if the unit cannot be accessed</li>
       </ol>
     </div>
     ${ctaBlock}`,
  );
}

export function inspectionRequestStatusEmailHtml(
  name: string,
  status: string,
  serial: string,
  detail: string,
): string {
  const color =
    status === 'APPROVED' ? brand.accent : status === 'DENIED' ? brand.primary : '#F4A261';
  return layout(
    `Inspection request ${status}`,
    `<p style="color:${brand.muted};">Hello ${name},</p>
     <p style="color:${brand.muted};">Your inspection request for unit <strong>${serial}</strong> is now:</p>
     <p style="text-align:center;margin:20px 0;">
       <span style="background:${color}22;color:${color};border:1px solid ${color};padding:8px 20px;border-radius:999px;font-weight:700;">${status}</span>
     </p>
     <p style="color:${brand.muted};line-height:1.6;">${detail}</p>`,
  );
}

export function expiryCriticalEmailHtml(
  serial: string,
  location: string,
  expiryDate: string,
  viewUrl?: string,
): string {
  const safeSerial = escapeHtml(serial);
  const safeLocation = escapeHtml(location);
  const safeExpiry = escapeHtml(expiryDate);
  const href = viewUrl?.trim() ? escapeHtml(viewUrl.trim()) : '';
  const ctaBlock = href
    ? `<table cellpadding="0" cellspacing="0" style="margin:24px 0 8px;">
         <tr><td style="border-radius:8px;background:${brand.primary};">
           <a href="${href}" style="display:inline-block;padding:14px 28px;color:#fff;font-size:14px;font-weight:700;text-decoration:none;">View extinguisher</a>
         </td></tr>
       </table>
       <p style="margin:0;color:${brand.muted};font-size:12px;">Update maintenance, extend expiry, or decommission the unit, then dismiss the in-app alert.</p>`
    : `<p style="color:${brand.muted};">Open Admin Portal → Fire Extinguishers, locate <strong style="color:${brand.text};">${safeSerial}</strong>, and take action.</p>`;

  return layout(
    'CRITICAL: Extinguisher expiring within 24 hours',
    `<p style="color:${brand.primary};font-weight:600;">Immediate attention required</p>
     <p style="color:${brand.muted};">Unit <strong style="color:${brand.text};">${safeSerial}</strong> at ${safeLocation} expires on <strong>${safeExpiry}</strong>.</p>
     ${ctaBlock}`,
  );
}

export function inspectionDueSoonEmailHtml(
  inspectorName: string,
  serial: string,
  location: string,
  scheduledLabel: string,
  overdue: boolean,
  viewUrl?: string,
): string {
  const safeName = escapeHtml(inspectorName);
  const safeSerial = escapeHtml(serial);
  const safeLocation = escapeHtml(location);
  const safeWhen = escapeHtml(scheduledLabel);
  const href = viewUrl?.trim() ? escapeHtml(viewUrl.trim()) : '';
  const headline = overdue ? 'Inspection overdue' : 'Inspection due within 24 hours';
  const lead = overdue
    ? `Your scheduled visit for <strong style="color:${brand.text};">${safeSerial}</strong> was due at ${safeWhen}.`
    : `Your visit for <strong style="color:${brand.text};">${safeSerial}</strong> at ${safeLocation} is due by ${safeWhen} (less than 24 hours).`;
  const ctaBlock = href
    ? `<table cellpadding="0" cellspacing="0" style="margin:24px 0 8px;">
         <tr><td style="border-radius:8px;background:${brand.secondary};">
           <a href="${href}" style="display:inline-block;padding:14px 28px;color:#101418;font-size:14px;font-weight:700;text-decoration:none;">Open assignment</a>
         </td></tr>
       </table>
       <p style="margin:0;color:${brand.muted};font-size:12px;">Record pass/fail on the assignment — the reminder clears once you submit an outcome.</p>`
    : '';

  return layout(
    headline,
    `<p style="color:${brand.muted};line-height:1.6;">Hello <strong style="color:${brand.text};">${safeName}</strong>,</p>
     <p style="color:${brand.muted};line-height:1.6;">${lead}</p>
     <p style="color:${brand.muted};font-size:13px;">No inspection outcome has been logged yet.</p>
     ${ctaBlock}`,
  );
}

export function newInspectionRequestAdminEmailHtml(
  requester: string,
  serial: string,
  preferredAt: string,
): string {
  return layout(
    'New inspection request',
    `<p style="color:${brand.muted};"><strong>${requester}</strong> requested an inspection.</p>
     <ul style="color:${brand.text};"><li>Unit: ${serial}</li><li>Preferred: ${preferredAt}</li></ul>
     <p style="color:${brand.muted};">Open Admin Portal → Inspection Requests to review.</p>`,
  );
}
