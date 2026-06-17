# 🐱 חנות מזון בעלי חיים — הוראות הקמה

## מה צריך לפני שמתחילים
- חשבון GitHub (בחינם): https://github.com
- חשבון Supabase (בחינם): https://supabase.com
- חשבון Vercel (בחינם): https://vercel.com

---

## שלב 1 — הקמת Supabase (בסיס הנתונים)

1. היכנסי ל-https://supabase.com ולחצי **Start your project**
2. הרשמי עם Google או אימייל
3. לחצי **New Project**:
   - בחרי שם לפרויקט (למשל: `pet-food-shop`)
   - הזיני סיסמה חזקה לבסיס הנתונים
   - בחרי Region: **West EU (Ireland)** (הכי קרוב לישראל)
   - לחצי **Create new project**
4. המתיני כ-2 דקות עד שהפרויקט מוכן

### יצירת הטבלאות
5. בתפריט הצדדי לחצי על **SQL Editor**
6. לחצי **New query**
7. פתחי את הקובץ `supabase_schema.sql` מהתיקייה הזו
8. העתיקי את כל התוכן והדביקי בחלון ה-SQL
9. לחצי **Run** (או Ctrl+Enter)
10. תראי "Success" — הטבלאות נוצרו!

### קבלת מפתחות ה-API
11. בתפריט לחצי **Project Settings** → **API**
12. העתיקי שני ערכים:
    - **Project URL** (משהו כמו `https://xxxx.supabase.co`)
    - **anon public key** (מחרוזת ארוכה שמתחילה ב-`eyJ`)

---

## שלב 2 — העלאת הקוד ל-GitHub

1. היכנסי ל-https://github.com ולחצי **New repository**
2. שמי `pet-food-shop` (ציבורי או פרטי — לא משנה)
3. לחצי **Create repository**
4. בתיקיית הפרויקט שלך הרץ:
```bash
git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/pet-food-shop.git
git push -u origin main
```

---

## שלב 3 — פריסה ב-Vercel

1. היכנסי ל-https://vercel.com ולחצי **Add New Project**
2. חברי את חשבון ה-GitHub שלך
3. בחרי את הריפוזיטורי `pet-food-shop`
4. לפני לחיצה על Deploy, פתחי **Environment Variables** והוסיפי:
   ```
   REACT_APP_SUPABASE_URL     = [ה-URL שהעתקת מסופאבייס]
   REACT_APP_SUPABASE_ANON_KEY = [ה-key שהעתקת מסופאבייס]
   ```
5. לחצי **Deploy**
6. לאחר ~2 דקות תקבלי כתובת כמו `https://pet-food-shop-xxx.vercel.app` 🎉

---

## שלב 4 — הגדרת המנהלת (את!)

אחרי שהאפליקציה עולה:

1. היכנסי לאפליקציה ולחצי **הרשמה** עם האימייל שלך
2. חזרי ל-Supabase → **Table Editor** → טבלת `profiles`
3. מצאי את השורה שלך ועדכני את השדה `is_admin` ל-`true`
4. התנתקי והתחברי מחדש — עכשיו תראי את ממשק המנהלת!

---

## שלב 5 — הזמנת חברים

שלחי לחברות שלך את קישור האפליקציה ובקשי מהן להירשם.
אחרי שנרשמות, הן מופיעות בטבלת `profiles` ויכולות להיכנס לאפליקציה ולהזמין מיד.

---

## שאלות נפוצות

**האם הנתונים מאובטחים?**
כן! Supabase מציעה Row Level Security — כל משתמש רואה רק את הנתונים שלו.

**האם זה בחינם?**
כן, לגמרי. Supabase מציעה 500MB ועד 50,000 משתמשים בחינם. Vercel מציעה Hobby plan חינמי לאתרים קטנים.

**איך מעדכנים מחירים?**
נכנסים בממשק המנהלת → לשונית "מוצרים" → לחיצה על "עריכה" ליד המוצר.

**איך מוסיפים חבר ידנית (בלי שהוא יירשם)?**
כרגע החברים נרשמים בעצמם. אם תרצי ליצור חשבון ידנית, נוסיף פיצ'ר כזה.
