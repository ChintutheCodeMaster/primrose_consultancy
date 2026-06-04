# Primrose IEC — Hebrew → English Translation Glossary

## Brand
- נגה / Noga → Primrose IEC
- ש"ח / ₪ → $ (USD)

## Core entities
- מתעניין / מתעניינים → Inquiry / Inquiries
- ליד / לידים → Lead / Leads
- סטודנט / סטודנטים → Student / Students
- לקוח עבר / לקוחות עבר → Alumni
- לא המשיכו / לא המשיך → Closed / Lost (or "Did Not Continue")
- יועץ / יועצים → Consultant / Consultants
- מנהל / אדמין → Admin
- פרויקט / פרויקטים → Project / Projects
- שותפויות → Collaborations
- הסכם / הסכמים → Engagement Agreement(s)
- חוזה → Contract
- פגישה / פגישות → Meeting / Meetings
- תיעוד שיחה → Call Log
- אנליטיקס / נתונים → Analytics
- לוח בקרה → Dashboard
- הגדרות → Settings

## Fields
- שם פרטי → First Name
- שם משפחה → Last Name
- שם מלא → Full Name
- טלפון → Phone
- אימייל / מייל → Email
- כתובת → Address
- תאריך → Date
- תאריך לידה → Date of Birth
- הערות → Notes
- סטטוס → Status
- מקור הגעה / מקור → Lead Source / Source
- ארץ → Country
- מדינות יעד → Target Countries
- אוניברסיטאות יעד → Target Universities
- תחום לימודים / תחום → Field of Interest / Field
- תחום עניין → Field of Interest
- שנת לימודים / שנה → Year
- שנת סיום / שנת תיכון → Graduation Year
- ציון ממוצע → GPA
- ממוצע → Average / GPA
- מלגה / מלגות → Scholarship(s)
- אישור קבלה → Acceptance Letter
- מסמכים → Documents
- קבצים → Files

## Status values
- פעיל → Active
- לא פעיל → Inactive
- התקבל → Accepted
- נרשם → Enrolled
- סיים → Graduated
- מושהה → Paused
- בוטל → Cancelled
- ממתין → Pending
- חדש → New
- בטיפול → In Progress
- הומר → Converted

## Financial
- מחיר → Price
- עלות → Cost
- חבילה / חבילת ייעוץ → Package
- עלות חבילה → Package Cost
- שכר טרחה → Fee
- שעות → Hours
- שעתי / לשעה → Hourly
- תעריף / תעריף שעתי → Hourly Rate
- שולם → Paid
- סכום ששולם → Amount Paid
- יתרה → Balance
- מע"מ → VAT (note: change Israeli 17% to configurable; default "tax")
- כולל מע"מ → incl. VAT
- ללא מע"מ → excl. VAT
- מקדמה → Deposit
- תשלום / תשלומים → Payment / Payments
- תאריך תשלום → Payment Date
- הכנסה / הכנסות → Income / Revenue
- חודש נוכחי → Current Month
- שנה נוכחית → Current Year

## Actions / UI
- שמור / שמירה → Save
- ביטול → Cancel
- מחק / מחיקה → Delete
- ערוך / עריכה → Edit
- הוסף → Add
- צור / יצירה → Create
- חדש / חדשה → New
- חיפוש → Search
- סנן / סינון → Filter
- אפס → Reset
- ייצא / ייצוא → Export
- ייבא / ייבוא → Import
- הורד / הורדה → Download
- העלה / העלאה → Upload
- שלח / שליחה → Send
- אישור / אשר → Confirm / OK
- סגור → Close
- פתח → Open
- בחר → Select
- הכל / הכול → All
- ללא → None
- כן → Yes
- לא → No
- טוען... → Loading...
- אין נתונים → No data
- נמצאו / נמצאו תוצאות → results found
- הצג → Show
- הסתר → Hide
- המר לסטודנט → Convert to Student
- צור הסכם → Create Agreement
- חתום → Sign / Signed
- חתימה → Signature

## Time / Dates
- היום → Today
- אתמול → Yesterday
- מחר → Tomorrow
- השבוע → This Week
- החודש → This Month
- השנה → This Year
- ימים → days
- שבועות → weeks
- חודשים → months
- שנים → years

## Misc messages
- שגיאה → Error
- הצלחה → Success
- אזהרה → Warning
- מידע → Info
- נמחק בהצלחה → Deleted successfully
- נשמר בהצלחה → Saved successfully
- עודכן בהצלחה → Updated successfully
- נוצר בהצלחה → Created successfully
- האם אתה בטוח? → Are you sure?
- פעולה זו אינה ניתנת לביטול → This action cannot be undone
- שדה חובה → Required field
- שגיאה בטעינת נתונים → Failed to load data

## Rules
1. Output: every user-visible string must be English. Keep code identifiers, DB column names, and option *values* unchanged.
2. Currency: ₪ → $, formatCurrency uses USD. Do not change stored numbers.
3. Direction: never re-introduce RTL classes. No `dir="rtl"`, no `text-right` where it should be `text-start`, etc. — but for this pass, keep refactor minimal: just translate strings + swap ₪ → $.
4. Toast/error messages: translate human strings; keep variable interpolations.
5. Tailwind margin/padding: do not change in this pass unless it's clearly broken in LTR.
6. Comments: leave Hebrew code comments alone if non-trivial; translate only when easy.
7. Do NOT touch: option *values* stored in DB enums (status keys etc.), supabase generated files, mock data IDs.
8. Keep file structure and exports identical.
