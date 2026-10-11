/* =========================================================
   LearnHub – E-Learning Support System
   ========================================================= */

/* =========================================================
   1. MODEL : Student
   ========================================================= */
class Student {
    #id; #name; #email; #password; #role;
    constructor({ id = '', name = '', email = '', password = '', role = 'student' } = {}) {
        this.#id       = String(id).trim();
        this.#name     = String(name).trim();
        this.#email    = String(email).trim().toLowerCase();
        this.#password = String(password);
        this.#role     = ['student', 'teacher', 'admin'].includes(role) ? role : 'student';
    }
    get id()    { return this.#id; }
    get name()  { return this.#name; }
    get email() { return this.#email; }
    get role()  { return this.#role; }
    rename(n)      { this.#name = String(n).trim(); }
    changeEmail(m) { this.#email = String(m).trim().toLowerCase(); }
    changePassword(p) { this.#password = String(p); }
    changeRole(r)  { if (['student','teacher','admin'].includes(r)) this.#role = r; }
    verifyPassword(plain) { return this.#password === String(plain); }
    toRecord() {
        return [this.#id, this.#name, this.#email, this.#password, this.#role]
            .map(Student.#escape).join('|');
    }
    static fromRecord(line) {
        const p = Student.#split(line);
        if (p.length < 4) return null;
        return new Student({ id: p[0], name: p[1], email: p[2], password: p[3], role: p[4] || 'student' });
    }
    toSession() { return { id: this.#id, name: this.#name, email: this.#email, role: this.#role }; }
    static #escape(v) {
        return String(v ?? '').replace(/\\/g, '\\\\').replace(/\|/g, '\\p').replace(/\r?\n/g, '\\n');
    }
    static #split(line) {
        const out = []; let cur = '';
        for (let i = 0; i < line.length; i++) {
            const ch = line[i];
            if (ch === '\\') {
                const nx = line[++i];
                if (nx === 'p')       cur += '|';
                else if (nx === 'n')  cur += '\n';
                else if (nx === '\\') cur += '\\';
                else                  cur += nx ?? '';
            } else if (ch === '|') { out.push(cur); cur = ''; }
            else { cur += ch; }
        }
        out.push(cur);
        return out;
    }
}

/* =========================================================
   1b. MODEL : Course
   ========================================================= */
class Course {
    #id; #title; #description; #credits;
    constructor({ id = '', title = '', description = '', credits = 3 } = {}) {
        this.#id          = String(id).trim();
        this.#title       = String(title).trim();
        this.#description = String(description).trim();
        this.#credits     = Number(credits) || 0;
    }
    get id()          { return this.#id; }
    get title()       { return this.#title; }
    get description() { return this.#description; }
    get credits()     { return this.#credits; }

    rename(t)          { this.#title = String(t).trim(); }
    changeDescription(d){ this.#description = String(d).trim(); }
    changeCredits(c)   { this.#credits = Number(c) || 0; }

    toRecord() {
        return [this.#id, this.#title, this.#description, this.#credits]
            .map(Course.#escape).join('|');
    }
    static fromRecord(line) {
        const p = Course.#split(line);
        if (p.length < 4) return null;
        return new Course({ id: p[0], title: p[1], description: p[2], credits: p[3] });
    }
    static #escape(v) {
        return String(v ?? '').replace(/\\/g, '\\\\').replace(/\|/g, '\\p').replace(/\r?\n/g, '\\n');
    }
    static #split(line) {
        const out = []; let cur = '';
        for (let i = 0; i < line.length; i++) {
            const ch = line[i];
            if (ch === '\\') {
                const nx = line[++i];
                if (nx === 'p')       cur += '|';
                else if (nx === 'n')  cur += '\n';
                else if (nx === '\\') cur += '\\';
                else                  cur += nx ?? '';
            } else if (ch === '|') { out.push(cur); cur = ''; }
            else { cur += ch; }
        }
        out.push(cur);
        return out;
    }
}

/* =========================================================
   2. FileStore
   ========================================================= */
class FileStore {
    #key; #memory = '';
    constructor(fileName) { this.#key = fileName; }
    read()  { try { return localStorage.getItem(this.#key) ?? ''; } catch { return this.#memory; } }
    write(t){ this.#memory = t; try { localStorage.setItem(this.#key, t); } catch {} }
    clear() { this.write(''); }
}

/* =========================================================
   3. StudentStore
   ========================================================= */
class StudentStore {
    #students = []; #file;
    constructor(file = new FileStore('students.txt')) {
        this.#file = file;
        this.#load();
    }
    create(student) {
        if (!(student instanceof Student)) throw new Error('Invalid student object.');
        if (this.findById(student.id)) throw new Error(`Student ID "${student.id}" already exists.`);
        if (this.findByEmail(student.email)) throw new Error('That email is already registered.');
        this.#students.push(student);
        this.#flush();
        return student;
    }
    all()    { return this.#students.map(s => s); }
    count()  { return this.#students.length; }
    findById(id) {
        const k = String(id ?? '').trim().toLowerCase();
        return this.#students.find(s => s.id.toLowerCase() === k) ?? null;
    }
    findByEmail(email) {
        const k = String(email ?? '').trim().toLowerCase();
        return this.#students.find(s => s.email === k) ?? null;
    }
    search(q) {
        const k = String(q ?? '').trim().toLowerCase();
        if (!k) return this.all();
        return this.#students.filter(s =>
            s.id.toLowerCase().includes(k) ||
            s.name.toLowerCase().includes(k) ||
            s.email.includes(k));
    }
    update(id, { name, email, password, role }) {
        const s = this.findById(id);
        if (!s) throw new Error('Student not found.');
        const other = this.findByEmail(email);
        if (other && other.id !== s.id) throw new Error('That email belongs to another student.');
        s.rename(name);
        s.changeEmail(email);
        if (password) s.changePassword(password);
        if (role)     s.changeRole(role);
        this.#flush();
        return s;
    }
    remove(id) {
        const i = this.#students.findIndex(
            s => s.id.toLowerCase() === String(id).trim().toLowerCase());
        if (i === -1) throw new Error('Student not found.');
        const [gone] = this.#students.splice(i, 1);
        this.#flush();
        return gone;
    }
    nextId() {
        const max = this.#students.reduce((m, s) => {
            const n = parseInt(String(s.id).replace(/\D/g, ''), 10);
            return Number.isFinite(n) && n > m ? n : m;
        }, 0);
        return 'STU' + String(max + 1).padStart(3, '0');
    }
    #load() {
        this.#students = this.#file.read().split(/\r?\n/).filter(l => l.trim() !== '')
            .map(Student.fromRecord).filter(Boolean);
    }
    #flush() {
        this.#file.write(this.#students.map(s => s.toRecord()).join('\n'));
    }
}

/* =========================================================
   3b. CourseStore
   ========================================================= */
class CourseStore {
    #courses = []; #file;
    constructor(file = new FileStore('courses.txt')) {
        this.#file = file;
        this.#load();
    }
    create(course) {
        if (!(course instanceof Course)) throw new Error('Invalid course object.');
        if (this.findById(course.id)) throw new Error(`Course ID "${course.id}" already exists.`);
        this.#courses.push(course);
        this.#flush();
        return course;
    }
    all()    { return this.#courses.map(c => c); }
    count()  { return this.#courses.length; }
    findById(id) {
        const k = String(id ?? '').trim().toLowerCase();
        return this.#courses.find(c => c.id.toLowerCase() === k) ?? null;
    }
    search(q) {
        const k = String(q ?? '').trim().toLowerCase();
        if (!k) return this.all();
        return this.#courses.filter(c =>
            c.id.toLowerCase().includes(k) ||
            c.title.toLowerCase().includes(k) ||
            c.description.toLowerCase().includes(k));
    }
    update(id, { title, description, credits }) {
        const c = this.findById(id);
        if (!c) throw new Error('Course not found.');
        c.rename(title);
        c.changeDescription(description);
        c.changeCredits(credits);
        this.#flush();
        return c;
    }
    remove(id) {
        const i = this.#courses.findIndex(
            c => c.id.toLowerCase() === String(id).trim().toLowerCase());
        if (i === -1) throw new Error('Course not found.');
        const [gone] = this.#courses.splice(i, 1);
        this.#flush();
        return gone;
    }
    nextId() {
        const max = this.#courses.reduce((m, c) => {
            const n = parseInt(String(c.id).replace(/\D/g, ''), 10);
            return Number.isFinite(n) && n > m ? n : m;
        }, 0);
        return 'CRS' + String(max + 1).padStart(3, '0');
    }
    #load() {
        this.#courses = this.#file.read().split(/\r?\n/).filter(l => l.trim() !== '')
            .map(Course.fromRecord).filter(Boolean);
    }
    #flush() {
        this.#file.write(this.#courses.map(c => c.toRecord()).join('\n'));
    }
}

/* =========================================================
   4. Validator
   ========================================================= */
class Validator {
    static name(v) {
        const s = String(v ?? '').trim();
        if (s.length < 3) throw new Error('Full name must be at least 3 characters.');
        if (!/^[\p{L}\p{M} .'-]+$/u.test(s))
            throw new Error("Name can only contain letters, spaces, . ' -");
        return s;
    }
    static email(v) {
        const s = String(v ?? '').trim();
        if (!/^\S+@\S+\.\S+$/.test(s)) throw new Error('Please enter a valid email address.');
        return s;
    }
    static password(v) {
        const s = String(v ?? '');
        if (s.length < 4) throw new Error('Password must be at least 4 characters long.');
        return s;
    }
    static studentId(v) {
        const s = String(v ?? '').trim().toUpperCase();
        if (s.length < 3) throw new Error('Student ID must be at least 3 characters.');
        if (!/^[A-Z0-9\-_]{3,15}$/.test(s))
            throw new Error('Student ID can only contain letters, numbers, - and _');
        return s;
    }
    static courseId(v) {
        const s = String(v ?? '').trim().toUpperCase();
        if (s.length < 2) throw new Error('Course ID must be at least 2 characters.');
        if (s.length > 15) throw new Error('Course ID must be under 15 characters.');
        if (!/^[A-Z0-9\-_]{2,15}$/.test(s))
            throw new Error('Course ID can only contain letters, numbers, - and _');
        return s;
    }
    static courseTitle(v) {
        const s = String(v ?? '').trim();
        if (s.length < 3) throw new Error('Course title must be at least 3 characters.');
        if (s.length > 80) throw new Error('Course title must be under 80 characters.');
        return s;
    }
    static courseDescription(v) {
        const s = String(v ?? '').trim();
        if (s.length < 5) throw new Error('Course description must be at least 5 characters.');
        if (s.length > 300) throw new Error('Course description must be under 300 characters.');
        return s;
    }
    static credits(v) {
        const n = parseInt(String(v ?? '').trim(), 10);
        if (!Number.isFinite(n) || n < 1 || n > 10)
            throw new Error('Credits must be a number between 1 and 10.');
        return n;
    }
}

/* =========================================================
   5. AuthService
   ========================================================= */
class AuthService {
    static SESSION_KEY = 'lh.session';
    static ADMIN = {
        id: 'ADM001', name: 'Administrator',
        email: 'admin@learnhub.app', password: 'admin123', role: 'admin'
    };
    #store; #current = null;
    constructor(store) {
        this.#store = store;
        this.#ensureAdmin();
        this.#restore();
    }
    get currentUser() { return this.#current; }
    get isLoggedIn()  { return this.#current !== null; }
    get isAdmin()     { return this.#current?.role === 'admin'; }
    signUp({ name, email, password, role = 'student' }) {
        const safeRole = role === 'teacher' ? 'teacher' : 'student';
        const clean = {
            name:     Validator.name(name),
            email:    Validator.email(email),
            password: Validator.password(password),
            role:     safeRole
        };
        const student = new Student({ id: this.#store.nextId(), ...clean });
        this.#store.create(student);
        return this.#login(student);
    }
    signIn(email, password) {
        const e = Validator.email(email);
        const student = this.#store.findByEmail(e);
        if (!student) throw new Error('No account found with that email. Please sign up first.');
        if (!student.verifyPassword(password)) throw new Error('Incorrect password. Please try again.');
        return this.#login(student);
    }
    demo() {
        const existing = this.#store.findById('STU000')
            ?? this.#store.findByEmail('demo@learnhub.app');
        if (existing) return this.#login(existing);
        const s = new Student({ id: 'STU000', name: 'Demo Student',
            email: 'demo@learnhub.app', password: 'demo', role: 'student' });
        this.#store.create(s);
        return this.#login(s);
    }
    signOut() {
        this.#current = null;
        try { localStorage.removeItem(AuthService.SESSION_KEY); } catch {}
    }
    #login(student) {
        this.#current = student;
        try {
            localStorage.setItem(AuthService.SESSION_KEY,
                JSON.stringify(student.toSession()));
        } catch {}
        return student;
    }
    #restore() {
        try {
            const raw = localStorage.getItem(AuthService.SESSION_KEY);
            if (!raw) return;
            const { id } = JSON.parse(raw);
            this.#current = this.#store.findById(id);
        } catch { this.#current = null; }
    }
    #ensureAdmin() {
        const a = AuthService.ADMIN;
        const exists = this.#store.findById(a.id) || this.#store.findByEmail(a.email);
        if (exists) return;
        this.#store.create(new Student(a));
    }
}

/* =========================================================
   6. App : Controller + View
   ========================================================= */
class App {

    static COURSES = [
        { icon: '🌐', cat: 'Technology', title: 'Web Development Basics',
            desc: 'HTML, CSS & JavaScript starter course.', lessons: 3, quiz: 3 },
        { icon: '➗', cat: 'Science', title: 'Mathematics Essentials',
            desc: 'Algebra, percentages and geometry.', lessons: 3, quiz: 3 },
        { icon: '📝', cat: 'Language', title: 'English Communication',
            desc: 'Grammar and writing skills.', lessons: 3, quiz: 3 }
    ];

    /* Course module metadata — shown on the "coming soon" style page */
    static COURSE_MODULE = {
        member: 'Member 2',
        icon: '📚',
        title: 'Course Details',
        file: 'courses.txt',
        features: [
            'Create: Add new course (Course ID, Title, Description, Credits)',
            'Read: View all courses or search by ID, title or description',
            'Update: Update course details',
            'Delete: Delete a course'
        ],
        pages: ['Add Course Form', 'View Courses Page', 'Edit Course Page']
    };

    static MODULES = {
        notes: {
            member: 'Member 3', icon: '📝',
            title: 'Course Notes & Materials', file: 'notes.txt',
            features: [
                'Create: Upload notes (Note ID, Title, Content URL, Course ID)',
                'Read: View all notes or materials for a course',
                'Update: Update note or material details',
                'Delete: Delete a note or material'
            ],
            pages: ['Upload Note Form', 'View Notes Page', 'Edit Note Page']
        },
        enrollments: {
            member: 'Member 4', icon: '🎓',
            title: 'Course Enrollment', file: 'enrollments.txt',
            features: [
                'Create: Enroll a student (Enrollment ID, Student ID, Course ID, Date)',
                'Read: View all enrollments or search by student or course',
                'Update: Update enrollment status',
                'Delete: Delete an enrollment'
            ],
            pages: ['Enroll Student Form', 'View Enrollments Page', 'Edit Enrollment Page']
        },
        payments: {
            member: 'Member 5', icon: '💳',
            title: 'Course Payment Records', file: 'payments.txt',
            features: [
                'Create: Record course payment (Payment ID, Student ID, Course ID, Amount, Date)',
                'Read: View all payments or search by student or course',
                'Update: Update payment details',
                'Delete: Delete a payment record'
            ],
            pages: ['Record Payment Form', 'View Payments Page', 'Edit Payment Page']
        },
        homework: {
            member: 'Member 3 (extra)', icon: '📋',
            title: 'Homework / Assignments', file: 'homework.txt',
            features: [
                'Create: Post new assignment (Homework ID, Course ID, Title, Due Date)',
                'Read: View all homework or filter by course',
                'Update: Update homework details',
                'Delete: Delete an assignment'
            ],
            pages: ['Post Homework Form', 'View Homework Page', 'Edit Homework Page']
        },
        feedback: {
            member: 'Member 5 (extra)', icon: '⭐',
            title: 'Course Feedback & Reviews', file: 'feedback.txt',
            features: [
                'Create: Submit review (Review ID, Student ID, Course ID, Rating, Comment)',
                'Read: View all reviews or filter by course',
                'Update: Update review details',
                'Delete: Delete a review'
            ],
            pages: ['Submit Review Form', 'View Reviews Page', 'Edit Review Page']
        }
    };

    #root; #store; #courseStore; #auth;

    #state = {
        view: 'landing', authMode: 'signin', error: '', flash: '',
        query: '', editId: null,
        courseQuery: '', courseEditId: null, courseViewId: null
    };

    #forms = { auth: {}, register: {}, edit: {}, search: {},
        courseAdd: {}, courseEdit: {}, courseSearch: {} };

    constructor(root) {
        this.#root        = root;
        this.#store       = new StudentStore(new FileStore('students.txt'));
        this.#courseStore = new CourseStore(new FileStore('courses.txt'));
        this.#auth        = new AuthService(this.#store);
    }

    start() { this.#bind(); this.render(); }

    #bind() {
        this.#root.addEventListener('click',  e => this.#onClick(e));
        this.#root.addEventListener('submit', e => this.#onSubmit(e));
        this.#root.addEventListener('input',  e => this.#onInput(e));
        this.#root.addEventListener('change', e => this.#onInput(e));
    }

    #closeMenu() {
        const dd  = document.getElementById('menu-dropdown');
        const btn = document.getElementById('menu-btn');
        if (dd)  dd.classList.remove('open');
        if (btn) btn.classList.remove('active');
    }

    #onClick(e) {
        if (!e.target.closest('.topbar-left')) this.#closeMenu();

        const el = e.target.closest('[data-act]');
        if (!el) return;
        e.preventDefault();
        const act = el.dataset.act;

        switch (act) {
            case 'menu-toggle': {
                const dd  = document.getElementById('menu-dropdown');
                const btn = document.getElementById('menu-btn');
                if (!dd) break;
                const isOpen = dd.classList.contains('open');
                if (isOpen) {
                    dd.classList.remove('open');
                    btn?.classList.remove('active');
                } else {
                    dd.classList.add('open');
                    btn?.classList.add('active');
                }
                break;
            }

            case 'theme': this.#toggleTheme(); break;
            case 'goto':
                this.#closeMenu();
                this.#go(el.dataset.view);
                break;

            case 'auth':
                this.#state.view = 'auth';
                this.#state.authMode = el.dataset.mode;
                this.#state.error = '';
                this.render();
                window.scrollTo({ top: 0 });
                break;

            case 'jump':
                document.getElementById(el.dataset.target)
                    ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                break;

            case 'role': {
                const key = el.dataset.form || 'auth';
                this.#forms[key] = this.#forms[key] || {};
                this.#forms[key].role = el.dataset.role;
                this.render();
                break;
            }

            case 'demo':
                try {
                    this.#auth.demo();
                    this.#go('dashboard', 'Logged in as demo student.');
                } catch (err) { this.#fail(err.message); }
                break;

            case 'logout':
                this.#auth.signOut();
                this.#state.view = 'landing';
                this.#go('landing');
                break;

            case 'edit':
                if (!this.#auth.isAdmin) { this.#fail('Admin access required.'); return; }
                this.#state.editId = el.dataset.id;
                this.#go('edit');
                break;

            case 'delete':
                if (!this.#auth.isAdmin) { this.#fail('Admin access required.'); return; }
                this.#deleteStudent(el.dataset.id);
                break;

            case 'course-view':
                this.#state.courseViewId = el.dataset.id;
                this.#go('course-view');
                break;

            case 'course-edit':
                if (!this.#auth.isAdmin) { this.#fail('Admin access required.'); return; }
                this.#state.courseEditId = el.dataset.id;
                this.#go('course-edit');
                break;

            case 'course-delete':
                if (!this.#auth.isAdmin) { this.#fail('Admin access required.'); return; }
                this.#deleteCourse(el.dataset.id);
                break;

            case 'clear-course-search':
                this.#forms.courseSearch.q = '';
                this.#state.courseQuery = '';
                this.render();
                break;

            case 'clear-search':
                this.#forms.search.q = '';
                this.#state.query = '';
                this.render();
                break;
        }
    }

    #onSubmit(e) {
        const form = e.target.closest('form[data-form]');
        if (!form) return;
        e.preventDefault();
        const kind = form.dataset.form;
        try {
            if (kind === 'auth')               this.#submitAuth();
            else if (kind === 'register')      this.#submitRegister();
            else if (kind === 'edit')          this.#submitEdit();
            else if (kind === 'search')        this.#submitSearch();
            else if (kind === 'courseAdd')     this.#submitCourseAdd();
            else if (kind === 'courseEdit')    this.#submitCourseEdit();
            else if (kind === 'courseSearch')  this.#submitCourseSearch();
        } catch (err) { this.#fail(err.message || 'Something went wrong.'); }
    }

    #onInput(e) {
        const el = e.target;
        if (!el.name) return;
        const form = el.closest('form[data-form]');
        if (!form) return;
        const key = form.dataset.form;
        this.#forms[key] = this.#forms[key] || {};
        this.#forms[key][el.name] = el.value;

        if (this.#state.error) {
            this.#state.error = '';
            const errBox = this.#root.querySelector('.err');
            if (errBox) errBox.remove();
        }
    }

    #go(view, flash = '') {
        this.#state.view  = view;
        this.#state.error = '';
        this.#state.flash = flash;
        this.render();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    #fail(msg) {
        this.#state.error = msg;
        this.#state.flash = '';
        this.render();
    }

    #toggleTheme() {
        const r = document.documentElement;
        const isDark = r.dataset.theme === 'dark' ||
            (!r.dataset.theme && matchMedia('(prefers-color-scheme: dark)').matches);
        r.dataset.theme = isDark ? 'light' : 'dark';
    }

    /* ---------- AUTH ---------- */
    #submitAuth() {
        const f = this.#forms.auth;
        if (this.#state.authMode === 'signup') {
            this.#auth.signUp({
                name: f.name, email: f.email,
                password: f.password, role: f.role || 'student'
            });
            this.#forms.auth = {};
            this.#go('dashboard', 'Account created — welcome!');
        } else {
            this.#auth.signIn(f.email, f.password);
            this.#forms.auth = {};
            this.#go('dashboard', 'Signed in successfully.');
        }
    }

    /* ---------- STUDENT ---------- */
    #submitRegister() {
        if (!this.#auth.isAdmin) throw new Error('Only administrators can register students.');
        const f = this.#forms.register;
        const student = new Student({
            id:       Validator.studentId(f.id),
            name:     Validator.name(f.name),
            email:    Validator.email(f.email),
            password: Validator.password(f.password),
            role:     ['student', 'teacher'].includes(f.role) ? f.role : 'student'
        });
        this.#store.create(student);
        this.#forms.register = {};
        this.#go('students', `Student ${student.id} created successfully.`);
    }

    #submitEdit() {
        if (!this.#auth.isAdmin) throw new Error('Only administrators can edit students.');
        const f  = this.#forms.edit;
        const id = this.#state.editId;
        this.#store.update(id, {
            name:     Validator.name(f.name),
            email:    Validator.email(f.email),
            password: f.password ? Validator.password(f.password) : '',
            role:     f.role
        });
        this.#forms.edit = {};
        this.#go('students', `Student ${id} updated successfully.`);
    }

    #submitSearch() {
        this.#state.query = this.#forms.search.q ?? '';
        this.#state.error = '';
        this.render();
    }

    #deleteStudent(id) {
        const s = this.#store.findById(id);
        if (!s) return;
        if (s.role === 'admin') { this.#fail('Cannot delete the administrator account.'); return; }
        if (!confirm(`Delete student ${s.id} – ${s.name} ?`)) return;
        try {
            this.#store.remove(id);
            this.#go('students', `Student ${id} deleted.`);
        } catch (err) { this.#fail(err.message); }
    }

    /* ---------- COURSE (CREATE — admin only) ---------- */
    #submitCourseAdd() {
        if (!this.#auth.isAdmin)
            throw new Error('Only administrators can create courses.');

        const f = this.#forms.courseAdd;
        const course = new Course({
            id:          Validator.courseId(f.id),
            title:       Validator.courseTitle(f.title),
            description: Validator.courseDescription(f.description),
            credits:     Validator.credits(f.credits)
        });
        this.#courseStore.create(course);
        this.#forms.courseAdd = {};
        this.#go('courses', `Course ${course.id} created successfully.`);
    }

    /* ---------- COURSE (UPDATE — admin only) ---------- */
    #submitCourseEdit() {
        if (!this.#auth.isAdmin)
            throw new Error('Only administrators can edit courses.');

        const f  = this.#forms.courseEdit;
        const id = this.#state.courseEditId;
        this.#courseStore.update(id, {
            title:       Validator.courseTitle(f.title),
            description: Validator.courseDescription(f.description),
            credits:     Validator.credits(f.credits)
        });
        this.#forms.courseEdit = {};
        this.#state.courseViewId = id;
        this.#go('course-view', `Course ${id} updated successfully.`);
    }

    /* ---------- COURSE (SEARCH) ---------- */
    #submitCourseSearch() {
        this.#state.courseQuery = this.#forms.courseSearch.q ?? '';
        this.#state.error = '';
        this.render();
    }

    /* ---------- COURSE (DELETE — admin only) ---------- */
    #deleteCourse(id) {
        if (!this.#auth.isAdmin) {
            this.#fail('Only administrators can delete courses.');
            return;
        }
        const c = this.#courseStore.findById(id);
        if (!c) return;
        if (!confirm(`Delete course ${c.id} – ${c.title} ?`)) return;
        try {
            this.#courseStore.remove(id);
            this.#go('courses', `Course ${id} deleted successfully.`);
        } catch (err) { this.#fail(err.message); }
    }

    /* ---------- RENDER ---------- */
    render() {
        this.#root.innerHTML = this.#auth.isLoggedIn
            ? this.#renderPrivate()
            : this.#renderPublic();
    }

    #renderPublic() {
        return this.#state.view === 'auth' ? this.#authPage() : this.#landingPage();
    }

    #renderPrivate() {
        switch (this.#state.view) {
            case 'dashboard':      return this.#dashboardPage();
            case 'register':       return this.#registerPage();
            case 'students':       return this.#studentsPage();
            case 'edit':           return this.#editPage();
            case 'courses':        return this.#coursesPage();
            case 'course-view':    return this.#courseViewPage();
            case 'course-add':     return this.#courseAddPage();
            case 'course-edit':    return this.#courseEditPage();
            case 'notes':          return this.#comingSoonPage('notes');
            case 'enrollments':    return this.#comingSoonPage('enrollments');
            case 'payments':       return this.#comingSoonPage('payments');
            case 'homework':       return this.#comingSoonPage('homework');
            case 'feedback':       return this.#comingSoonPage('feedback');
            default:               return this.#dashboardPage();
        }
    }

    static esc(s) {
        return String(s ?? '').replace(/[&<>"']/g, c => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[c]));
    }

    #errorBox() {
        return this.#state.error ? `<div class="err">⚠️ ${App.esc(this.#state.error)}</div>` : '';
    }
    #flashBox() {
        return this.#state.flash ? `<div class="ok">✅ ${App.esc(this.#state.flash)}</div>` : '';
    }
    #roleTag(role) {
        const cls = role === 'admin' ? 'tag admin'
            : role === 'teacher' ? 'tag teacher' : 'tag';
        return `<span class="${cls}">${App.esc(role)}</span>`;
    }

    /* ============ APP HEADER ============ */
    #appHeader() {
        const admin = this.#auth.isAdmin;
        const v = this.#state.view;
        const isCourseView = v === 'courses' || v === 'course-add' || v === 'course-edit' || v === 'course-view';

        const menuBtn = `
            <button class="menu-btn" id="menu-btn"
                    data-act="menu-toggle"
                    title="Menu" aria-label="Open menu">☰</button>
        `;

        const systemSection = admin ? `
            <div class="menu-sep"></div>
            <div class="menu-head">⚙️ System</div>

            <button class="menu-item ${v === 'students' ? 'active' : ''}"
                    data-act="goto" data-view="students">
                <span class="mi">👥</span>
                <span>Student Management</span>
            </button>

            <button class="menu-item ${v === 'payments' ? 'active' : ''}"
                    data-act="goto" data-view="payments">
                <span class="mi">💳</span>
                <span>Payment Records</span>
            </button>
        ` : '';

        const dropdown = `
            <div class="menu-dropdown" id="menu-dropdown">
                <div class="menu-head">🧭 Navigation</div>

                <button class="menu-item ${v === 'dashboard' ? 'active' : ''}"
                        data-act="goto" data-view="dashboard">
                    <span class="mi">🏠</span>
                    <span>Home</span>
                </button>

                <button class="menu-item ${isCourseView ? 'active' : ''}"
                        data-act="goto" data-view="courses">
                    <span class="mi">📖</span>
                    <span>Course Details</span>
                </button>

                <button class="menu-item ${v === 'notes' ? 'active' : ''}"
                        data-act="goto" data-view="notes">
                    <span class="mi">📝</span>
                    <span>Course Notes / Study Materials</span>
                </button>

                <button class="menu-item ${v === 'enrollments' ? 'active' : ''}"
                        data-act="goto" data-view="enrollments">
                    <span class="mi">🎓</span>
                    <span>Course Enrollment</span>
                </button>

                <button class="menu-item ${v === 'homework' ? 'active' : ''}"
                        data-act="goto" data-view="homework">
                    <span class="mi">📋</span>
                    <span>Assignment</span>
                </button>

                <button class="menu-item ${v === 'feedback' ? 'active' : ''}"
                        data-act="goto" data-view="feedback">
                    <span class="mi">⭐</span>
                    <span>Course Feedback / Reviews</span>
                </button>

                ${systemSection}
            </div>
        `;

        return `
        <header class="topbar">
            <div class="topbar-left">
                ${menuBtn}
                <div class="logo" data-act="goto" data-view="dashboard">🎓 LearnHub</div>
                ${dropdown}
            </div>
            <div class="pnav-r">
                <button class="icon" data-act="theme" title="Toggle theme">🌓</button>
                <button data-act="logout">Logout</button>
            </div>
        </header>`;
    }

    #comingSoonPage(key) {
        const m = App.MODULES[key];
        if (!m) return this.#dashboardPage();
        return `
        ${this.#appHeader()}
        <main class="soon">
            <div class="soon-icon">${m.icon}</div>
            <h1>${App.esc(m.title)}</h1>
            <p>Handled by <b>${App.esc(m.member)}</b> · Data file: <code>${App.esc(m.file)}</code></p>
            <div class="soon-card">
                <h3>🎯 Required Features</h3>
                <ul>${m.features.map(f => `<li>${App.esc(f)}</li>`).join('')}</ul>
            </div>
            <div class="soon-card" style="margin-top:16px">
                <h3>📄 Required Pages</h3>
                <ul>${m.pages.map(p => `<li>${App.esc(p)}</li>`).join('')}</ul>
            </div>
            <div class="soon-actions">
                <button class="p big" data-act="goto" data-view="dashboard">← Back to Dashboard</button>
            </div>
        </main>`;
    }

    /* ============ LANDING ============ */
    #landingPage() {
        const cs = App.COURSES;
        const feats = [
            ['📖', 'Structured lessons', 'Bite-sized lessons with clear explanations and real examples.'],
            ['❓', 'Instant quizzes', 'Timed quizzes with instant scoring and feedback.'],
            ['📋', 'Assignments', 'Submit written work and get graded by your teacher.'],
            ['💬', 'Discussions', 'Ask questions and share tips with the community.'],
            ['📒', 'Personal notes', 'Jot notes for every course — saved automatically.'],
            ['🏅', 'Certificates', 'Finish a course with 67%+ and print your certificate.'],
            ['🎮', 'XP, badges & streaks', 'Stay motivated with levels, badges and daily streaks.'],
            ['🧑‍🏫', 'Teacher panel', 'Create courses, post announcements and grade work.']
        ];
        const faqs = [
            ['Is LearnHub free?', 'Yes — every course, quiz and certificate is completely free.'],
            ['Do I need to install anything?', 'No. LearnHub runs in your browser and saves your progress locally on this device.'],
            ['How do I earn a certificate?', 'Complete all lessons in a course and score 67% or more on its quiz.'],
            ['Can teachers create courses?', 'Yes. Sign up as a teacher to publish courses, post announcements and grade submissions.']
        ];

        return `
        <header class="topbar">
            <div class="topbar-left">
                <div class="logo" data-act="goto" data-view="landing">🎓 LearnHub</div>
            </div>
            <nav class="pnav">
                <a data-act="jump" data-target="features">Features</a>
                <a data-act="jump" data-target="courses">Courses</a>
                <a data-act="jump" data-target="how">How it works</a>
                <a data-act="jump" data-target="faq">FAQ</a>
            </nav>
            <div class="pnav-r">
                <button class="icon" data-act="theme" title="Toggle theme">🌓</button>
                <button class="p" data-act="auth" data-mode="signin">Sign In / Sign Up</button>
            </div>
        </header>

        <main class="land">
            <section class="hero2">
                <div>
                    <span class="pill">✨ 100% free · Learn at your own pace</span>
                    <h1>Learn smarter with <span class="grad">LearnHub</span></h1>
                    <p class="lead">Lessons, quizzes, assignments, discussions and certificates — everything you need to learn and teach, in one friendly place.</p>
                    <div class="cta">
                        <button class="p xl" data-act="auth" data-mode="signup">🚀 Get started — it's free</button>
                        <button class="xl ghost" data-act="jump" data-target="courses">📚 Browse courses</button>
                    </div>
                    <div class="trust">
                        <span>⭐ 4.8 / 5 learner rating</span>
                        <span>👩‍🎓 12,400+ learners</span>
                        <span>🏅 Free certificates</span>
                    </div>
                </div>
                <div class="h-right">
                    <div class="blob"></div>
                    <div class="orb">🎓</div>
                    <div class="float-card c1"><b>📖 Lesson complete</b><span>+10 XP</span></div>
                    <div class="float-card c2"><b>🏆 Quiz Master</b><span>Badge unlocked</span></div>
                    <div class="float-card c3"><b>🔥 5-day streak</b><span>Keep it up!</span></div>
                </div>
            </section>

            <section class="strip">
                <div><b>${cs.length}+</b><span>Courses</span></div>
                <div><b>12,400+</b><span>Learners</span></div>
                <div><b>98%</b><span>Completion rate</span></div>
                <div><b>24/7</b><span>Always available</span></div>
            </section>

            <section id="features" class="sec">
                <h2>Everything you need to learn</h2>
                <p class="sub">A complete learning system — not just videos.</p>
                <div class="fgrid">${feats.map(([i, t, d]) =>
            `<div class="fcard"><div class="fi">${i}</div><h3>${t}</h3><p>${d}</p></div>`
        ).join('')}</div>
            </section>

            <section id="courses" class="sec">
                <h2>Popular courses</h2>
                <p class="sub">Start with one of these — sign in to unlock every lesson.</p>
                <div class="grid">${cs.map(c => `
                    <div class="card course" data-act="auth" data-mode="signup">
                        <div class="ico">${App.esc(c.icon)}</div>
                        <h3 style="margin:6px 0">${App.esc(c.title)}</h3>
                        <span class="tag">${App.esc(c.cat)}</span>
                        <p class="mut">${App.esc(c.desc)}</p>
                        <div class="mut">${c.lessons} lessons · ${c.quiz} quiz questions</div>
                    </div>`).join('')}</div>
            </section>

            <section id="how" class="sec">
                <h2>How it works</h2>
                <p class="sub">Get learning in three simple steps.</p>
                <div class="steps">
                    <div class="step"><b>1</b><h3>Create your free account</h3><p class="mut">Sign up in seconds as a student or a teacher.</p></div>
                    <div class="step"><b>2</b><h3>Pick a course &amp; learn</h3><p class="mut">Read lessons, take notes, bookmark and discuss.</p></div>
                    <div class="step"><b>3</b><h3>Test yourself &amp; earn</h3><p class="mut">Pass the quiz, finish the lessons, print your certificate.</p></div>
                </div>
            </section>

            <section id="faq" class="sec faq">
                <h2>Frequently asked questions</h2>
                <p class="sub">Still curious? Everything you need to know.</p>
                ${faqs.map(([q, a]) =>
            `<details><summary>${q}</summary><p>${a}</p></details>`).join('')}
            </section>

            <section class="banner">
                <h2>Ready to start learning?</h2>
                <p>Join thousands of learners building new skills every day.</p>
                <button class="p xl" data-act="auth" data-mode="signup">Create free account →</button>
            </section>
        </main>

        <footer class="foot"><div class="foot-in">
            <div>
                <div class="logo">🎓 LearnHub</div>
                <p style="margin:8px 0 0;max-width:290px">A friendly e-learning support system for students and teachers.</p>
            </div>
            <div>
                <b>Explore</b>
                <a data-act="jump" data-target="features">Features</a>
                <a data-act="jump" data-target="courses">Courses</a>
                <a data-act="jump" data-target="faq">FAQ</a>
            </div>
            <div>
                <b>Account</b>
                <a data-act="auth" data-mode="signin">Sign in</a>
                <a data-act="auth" data-mode="signup">Sign up</a>
                <a data-act="demo">Demo login</a>
            </div>
        </div>
        <p class="mut center" style="margin:24px 0 0">© ${new Date().getFullYear()} LearnHub · Demo project.</p>
        </footer>`;
    }

    /* ============ AUTH PAGE ============ */
    #authPage() {
        const si   = this.#state.authMode !== 'signup';
        const f    = this.#forms.auth;
        const role = f.role || 'student';

        return `
        <header class="topbar">
            <div class="topbar-left">
                <div class="logo" data-act="goto" data-view="landing">🎓 LearnHub</div>
            </div>
            <div class="pnav-r">
                <button class="icon" data-act="theme" title="Toggle theme">🌓</button>
                <button data-act="goto" data-view="landing">← Back to home</button>
            </div>
        </header>

        <main class="authwrap">
            <div class="authcard">
                <div class="authart">
                    <h2>${si ? 'Welcome back 👋' : 'Join LearnHub 🎓'}</h2>
                    <p>${si ? 'Sign in to continue your learning journey.'
            : 'Create a free account and start learning today.'}</p>
                    <ul class="perks">
                        <li>✅ Free courses &amp; timed quizzes</li>
                        <li>✅ XP, badges &amp; daily streaks</li>
                        <li>✅ Certificates on completion</li>
                        <li>✅ Teacher tools for grading</li>
                    </ul>
                </div>
                <div class="authform">
                    <div class="tabs2">
                        <button type="button" class="${si ? 'on' : ''}"  data-act="auth" data-mode="signin">Sign In</button>
                        <button type="button" class="${!si ? 'on' : ''}" data-act="auth" data-mode="signup">Sign Up</button>
                    </div>

                    ${si ? `<div class="hint">
                        🔐 <b>Admin login:</b> <code>admin@learnhub.app</code> / <code>admin123</code>
                    </div>` : ''}

                    ${this.#errorBox()}

                    <form data-form="auth" autocomplete="off">
                        ${!si ? `<label>Full name
                            <input name="name" maxlength="40" placeholder="e.g. Nimal Perera"
                                   value="${App.esc(f.name)}">
                        </label>` : ''}
                        <label>Email
                            <input name="email" type="email" placeholder="you@example.com"
                                   value="${App.esc(f.email)}">
                        </label>
                        <label>Password
                            <input name="password" type="password" placeholder="••••••••"
                                   value="${App.esc(f.password)}">
                        </label>
                        ${!si ? `<label>I am a
                            <div class="row" style="margin-top:6px">
                                <button type="button" class="chip ${role === 'student' ? 'on' : ''}"
                                        data-act="role" data-form="auth" data-role="student">🎒 Student</button>
                                <button type="button" class="chip ${role === 'teacher' ? 'on' : ''}"
                                        data-act="role" data-form="auth" data-role="teacher">🧑‍🏫 Teacher</button>
                            </div>
                        </label>` : ''}
                        <button class="p big w100" type="submit">
                            ${si ? 'Sign In →' : 'Create account →'}
                        </button>
                    </form>
                    <button class="ghost w100" style="margin-top:8px" type="button" data-act="demo">
                        ⚡ Quick demo login (as student)
                    </button>
                    <p class="mut center">${si
            ? `Don't have an account? <a data-act="auth" data-mode="signup">Sign up</a>`
            : `Already registered? <a data-act="auth" data-mode="signin">Sign in</a>`}</p>
                </div>
            </div>
        </main>`;
    }

    /* ============ DASHBOARD ============ */
    #dashboardPage() {
        const u = this.#auth.currentUser;
        const admin = u.role === 'admin';
        const initial = (u.name || 'U').charAt(0).toUpperCase();
        const firstName = u.name.split(' ')[0];

        const enrolled = 3, lessonsDone = 7, xp = 240, streak = 5, overallProgress = 68;

        const courses = App.COURSES.map((c, i) => ({
            ...c, progress: [65, 40, 20][i] ?? 0
        }));

        const achievements = [
            { icon: '🌟', name: 'First Steps',  desc: 'First lesson',  unlocked: true },
            { icon: '🔥', name: 'On Fire',      desc: '5-day streak',  unlocked: true },
            { icon: '📚', name: 'Bookworm',     desc: '10 lessons',    unlocked: true },
            { icon: '🏆', name: 'Quiz Master',  desc: '5 quizzes',     unlocked: false },
            { icon: '⚡', name: 'Speedster',    desc: '500 XP',        unlocked: false },
            { icon: '🎓', name: 'Graduate',     desc: '1 course done', unlocked: false }
        ];

        const activities = [
            { icon: '📖', cls: 'p', title: 'Completed lesson "CSS Grid Basics"', time: '2 hours ago' },
            { icon: '🏆', cls: 'o', title: 'Scored 8/10 on JavaScript Quiz',     time: 'Yesterday' },
            { icon: '🔥', cls: 'r', title: 'Started a 5-day learning streak',    time: '2 days ago' },
            { icon: '✅', cls: 'g', title: 'Finished "HTML Fundamentals"',       time: '3 days ago' }
        ];

        const leaders = [
            { name: 'Kasun Perera',   xp: 1240, me: false },
            { name: 'Amaya Silva',    xp: 980,  me: false },
            { name: firstName,         xp: 240,  me: true  },
            { name: 'Nimal Jayawardena', xp: 180, me: false }
        ].sort((a, b) => b.xp - a.xp);

        const dashOffset = 339.292 * (1 - (admin ? 1 : overallProgress / 100));

        const moduleCards = `
        <section class="dash-sec">
            <div class="dash-sec-head">
                <h2>🧩 System Modules</h2>
                <a>5 members · CRUD operations</a>
            </div>
            <div class="quick-grid">
                <button type="button" class="quick-card" data-act="goto" data-view="students">
                    <div class="q-icon">👥</div>
                    <div><b>Student Management</b><span>Member 1 · students.txt</span></div>
                </button>
                <button type="button" class="quick-card" data-act="goto" data-view="courses">
                    <div class="q-icon">📚</div>
                    <div><b>Course Management</b><span>Member 2 · courses.txt</span></div>
                </button>
                <button type="button" class="quick-card" data-act="goto" data-view="notes">
                    <div class="q-icon">📝</div>
                    <div><b>Notes &amp; Materials</b><span>Member 3 · notes.txt</span></div>
                </button>
                <button type="button" class="quick-card" data-act="goto" data-view="enrollments">
                    <div class="q-icon">🎓</div>
                    <div><b>Course Enrollment</b><span>Member 4 · enrollments.txt</span></div>
                </button>
                <button type="button" class="quick-card" data-act="goto" data-view="payments">
                    <div class="q-icon">💳</div>
                    <div><b>Payment Records</b><span>Member 5 · payments.txt</span></div>
                </button>
                <button type="button" class="quick-card" data-act="goto" data-view="homework">
                    <div class="q-icon">📋</div>
                    <div><b>Homework</b><span>Assignments tracker</span></div>
                </button>
                <button type="button" class="quick-card" data-act="goto" data-view="feedback">
                    <div class="q-icon">⭐</div>
                    <div><b>Feedback &amp; Reviews</b><span>Student reviews</span></div>
                </button>
            </div>
        </section>`;

        return `
        ${this.#appHeader()}
        <main class="dash">

            <section class="dash-hero">
                <div class="dash-hero-left">
                    <div class="avatar">${App.esc(initial)}</div>
                    <div style="min-width:0">
                        <h1>Hey <span class="grad">${App.esc(firstName)}</span> 👋</h1>
                        <p>${admin ? 'You are running LearnHub as administrator.'
            : "Let's make today count — pick up where you left off."}</p>
                        <div class="badges">
                            ${this.#roleTag(u.role)}
                            <span class="tag">📧 ${App.esc(u.email)}</span>
                            ${admin ? `<span class="tag">🆔 ${App.esc(u.id)}</span>` : ''}
                        </div>
                    </div>
                </div>
                <div class="progress-ring">
                    <svg viewBox="0 0 120 120">
                        <circle class="ring-bg" cx="60" cy="60" r="54"></circle>
                        <circle class="ring-fg" cx="60" cy="60" r="54"
                                style="stroke-dashoffset: ${dashOffset}"></circle>
                    </svg>
                    <div class="ring-text">
                        <div class="ring-num">${admin ? '👑' : overallProgress + '%'}</div>
                        <div class="ring-lbl">${admin ? 'Admin' : 'Progress'}</div>
                    </div>
                </div>
            </section>

            ${this.#flashBox()}
            ${this.#errorBox()}

            <section class="dash-stats">
                ${admin ? `
                    <div class="stat-card">
                        <div class="stat-top"><div class="stat-icon i1">👥</div><span class="stat-badge">Live</span></div>
                        <div class="stat-val">${this.#store.count()}</div>
                        <div class="stat-lbl">Total accounts</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-top"><div class="stat-icon i2">🎒</div><span class="stat-badge">+2 this week</span></div>
                        <div class="stat-val">${this.#store.all().filter(s => s.role === 'student').length}</div>
                        <div class="stat-lbl">Students</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-top"><div class="stat-icon i3">🧑‍🏫</div></div>
                        <div class="stat-val">${this.#store.all().filter(s => s.role === 'teacher').length}</div>
                        <div class="stat-lbl">Teachers</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-top"><div class="stat-icon i4">📚</div><span class="stat-badge">Active</span></div>
                        <div class="stat-val">${this.#courseStore.count()}</div>
                        <div class="stat-lbl">Courses</div>
                    </div>
                ` : `
                    <div class="stat-card">
                        <div class="stat-top"><div class="stat-icon i1">📚</div><span class="stat-badge">+1 new</span></div>
                        <div class="stat-val">${enrolled}</div>
                        <div class="stat-lbl">Enrolled courses</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-top"><div class="stat-icon i2">✅</div><span class="stat-badge">+3 today</span></div>
                        <div class="stat-val">${lessonsDone}</div>
                        <div class="stat-lbl">Lessons completed</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-top"><div class="stat-icon i3">⚡</div><span class="stat-badge">+40 XP</span></div>
                        <div class="stat-val">${xp}</div>
                        <div class="stat-lbl">XP earned</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-top"><div class="stat-icon i4">🔥</div><span class="stat-badge">Personal best</span></div>
                        <div class="stat-val">${streak}</div>
                        <div class="stat-lbl">Day streak</div>
                    </div>
                `}
            </section>

            ${admin ? moduleCards : ''}

            <section class="dash-sec">
                <div class="dash-sec-head">
                    <h2>${admin ? '📚 All courses' : '📚 Continue learning'}</h2>
                    <a>View all →</a>
                </div>
                <div class="dash-grid">
                    ${courses.map(c => `
                        <div class="course-card">
                            <div class="cc-top">
                                <div class="cc-icon">${App.esc(c.icon)}</div>
                                <span class="tag">${App.esc(c.cat)}</span>
                            </div>
                            <h3>${App.esc(c.title)}</h3>
                            <p class="cc-cat">${App.esc(c.desc)}</p>
                            <div class="progress"><span style="width:${c.progress}%"></span></div>
                            <div class="cc-meta">
                                <span>📖 ${c.lessons} lessons</span>
                                <span>${c.progress}% done</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </section>

            ${admin ? '' : `
            <section class="dash-sec">
                <div class="dash-sec-head">
                    <h2>🏅 Achievements</h2>
                    <a>${achievements.filter(a => a.unlocked).length} / ${achievements.length} unlocked</a>
                </div>
                <div class="ach-grid">
                    ${achievements.map(a => `
                        <div class="ach-card ${a.unlocked ? '' : 'locked'}">
                            <div class="ach-icon">${a.icon}</div>
                            <div class="ach-name">${a.name}</div>
                            <div class="ach-desc">${a.desc}</div>
                        </div>
                    `).join('')}
                </div>
            </section>

            <section class="dash-cols">
                <div>
                    <div class="dash-sec-head"><h2>📋 Recent activity</h2></div>
                    <div class="feed">
                        ${activities.map(a => `
                            <div class="feed-item">
                                <div class="feed-dot ${a.cls}">${a.icon}</div>
                                <div class="feed-body">
                                    <div class="feed-title">${a.title}</div>
                                    <div class="feed-time">${a.time}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div>
                    <div class="dash-sec-head"><h2>🏆 Leaderboard</h2></div>
                    <div class="lb">
                        ${leaders.map((l, i) => {
            const rankCls = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';
            const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (i + 1);
            return `
                            <div class="lb-row ${l.me ? 'me' : ''}">
                                <div class="lb-rank ${rankCls}">${medal}</div>
                                <div class="lb-avatar">${l.name.charAt(0).toUpperCase()}</div>
                                <div class="lb-name">${App.esc(l.name)}${l.me ? ' <span class="mut">(you)</span>' : ''}</div>
                                <div class="lb-xp">${l.xp} XP</div>
                            </div>`;
        }).join('')}
                    </div>
                </div>
            </section>
            `}
        </main>`;
    }

    /* ============ STUDENT PAGES ============ */
    #registerPage() {
        if (!this.#auth.isAdmin) return this.#dashboardPage();
        const f    = this.#forms.register;
        const role = f.role || 'student';
        return `
        ${this.#appHeader()}
        <main class="page">
            <div class="pagehead">
                <h1>Student Registration</h1>
                <p class="mut">Member 1 · Saved to <code>students.txt</code></p>
            </div>
            ${this.#errorBox()}
            <form class="formcard" data-form="register" autocomplete="off">
                <label>Student ID<input name="id" placeholder="e.g. STU001"
                    value="${App.esc(f.id !== undefined ? f.id : this.#store.nextId())}"></label>
                <label>Full name<input name="name" maxlength="40"
                    placeholder="e.g. Nimal Perera" value="${App.esc(f.name)}"></label>
                <label>Email<input name="email" type="email"
                    placeholder="you@example.com" value="${App.esc(f.email)}"></label>
                <label>Password<input name="password" type="password"
                    placeholder="min 4 characters" value="${App.esc(f.password)}"></label>
                <label>Role
                    <div class="row" style="margin-top:6px">
                        <button type="button" class="chip ${role === 'student' ? 'on' : ''}"
                                data-act="role" data-form="register" data-role="student">🎒 Student</button>
                        <button type="button" class="chip ${role === 'teacher' ? 'on' : ''}"
                                data-act="role" data-form="register" data-role="teacher">🧑‍🏫 Teacher</button>
                    </div>
                </label>
                <div class="row">
                    <button class="p big" type="submit">➕ Create student</button>
                    <button class="big ghost" type="button" data-act="goto" data-view="students">Cancel</button>
                </div>
            </form>
        </main>`;
    }

    #studentsPage() {
        if (!this.#auth.isAdmin) return this.#dashboardPage();
        const q    = this.#state.query;
        const list = this.#store.search(q);
        const rows = list.map(s => `
            <tr>
                <td><code>${App.esc(s.id)}</code></td>
                <td>${App.esc(s.name)}</td>
                <td>${App.esc(s.email)}</td>
                <td>${this.#roleTag(s.role)}</td>
                <td class="tright">
                    <button class="sm" data-act="edit" data-id="${App.esc(s.id)}">✏️ Edit</button>
                    <button class="sm danger" data-act="delete" data-id="${App.esc(s.id)}">🗑 Delete</button>
                </td>
            </tr>`).join('');
        return `
        ${this.#appHeader()}
        <main class="page">
            <div class="pagehead">
                <h1>View / Search Students</h1>
                <p class="mut">Member 1 · ${this.#store.count()} record(s) in <code>students.txt</code></p>
            </div>
            ${this.#errorBox()}
            ${this.#flashBox()}
            <form class="searchbar" data-form="search">
                <input name="q" placeholder="Search by ID, name or email…" value="${App.esc(q)}">
                <button class="p" type="submit">🔍 Search</button>
                <button class="ghost" type="button" data-act="clear-search">Clear</button>
                <button class="ghost" type="button" data-act="goto" data-view="register">➕ New student</button>
            </form>
            ${list.length ? `
            <div class="tablewrap">
                <table class="table">
                    <thead><tr><th>Student ID</th><th>Name</th><th>Email</th><th>Role</th><th></th></tr></thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>` : `
            <div class="empty">😕 No students found${q ? ` for "${App.esc(q)}"` : ''}.</div>`}
        </main>`;
    }

    #editPage() {
        if (!this.#auth.isAdmin) return this.#dashboardPage();
        const s = this.#store.findById(this.#state.editId);
        if (!s) { this.#state.view = 'students'; return this.#studentsPage(); }
        const f   = this.#forms.edit;
        const val = (k, fb) => (f[k] !== undefined ? f[k] : fb);
        const role = val('role', s.role);
        return `
        ${this.#appHeader()}
        <main class="page">
            <div class="pagehead">
                <h1>Edit Student Details</h1>
                <p class="mut">Member 1 · Updating <code>${App.esc(s.id)}</code></p>
            </div>
            ${this.#errorBox()}
            <form class="formcard" data-form="edit" autocomplete="off">
                <label>Student ID<input value="${App.esc(s.id)}" disabled></label>
                <label>Full name<input name="name" maxlength="40"
                    value="${App.esc(val('name', s.name))}"></label>
                <label>Email<input name="email" type="email"
                    value="${App.esc(val('email', s.email))}"></label>
                <label>New password <span class="mut">(leave blank to keep current)</span>
                    <input name="password" type="password"
                           value="${App.esc(val('password', ''))}"></label>
                <label>Role
                    <div class="row" style="margin-top:6px">
                        <button type="button" class="chip ${role === 'student' ? 'on' : ''}"
                                data-act="role" data-form="edit" data-role="student">🎒 Student</button>
                        <button type="button" class="chip ${role === 'teacher' ? 'on' : ''}"
                                data-act="role" data-form="edit" data-role="teacher">🧑‍🏫 Teacher</button>
                    </div>
                </label>
                <div class="row">
                    <button class="p big" type="submit">💾 Save changes</button>
                    <button class="big ghost" type="button" data-act="goto" data-view="students">Cancel</button>
                </div>
            </form>
        </main>`;
    }

    /* ============================================================
       COURSE PAGES — Coming Soon style (like Course Enrollment)
       ============================================================ */

    /* ---------- Course Details — COMING SOON STYLE ---------- */
    #coursesPage() {
        const m = App.COURSE_MODULE;
        const isAdmin = this.#auth.isAdmin;

        return `
        ${this.#appHeader()}
        <main class="soon">
            <div class="soon-icon">${m.icon}</div>
            <h1>${App.esc(m.title)}</h1>
            <p>Handled by <b>${App.esc(m.member)}</b> · Data file: <code>${App.esc(m.file)}</code></p>

            ${this.#errorBox()}
            ${this.#flashBox()}

            <div class="soon-card">
                <h3>🎯 Required Features</h3>
                <ul>${m.features.map(f => `<li>${App.esc(f)}</li>`).join('')}</ul>
            </div>

            <div class="soon-card" style="margin-top:16px">
                <h3>📄 Required Pages</h3>
                <ul>${m.pages.map(p => `<li>${App.esc(p)}</li>`).join('')}</ul>
            </div>

            <div class="soon-actions">
                ${isAdmin ? `
                    <button class="p big" data-act="goto" data-view="course-add">➕ Add New Course</button>
                ` : ''}
                <button class="big ghost" data-act="goto" data-view="dashboard">← Back to Dashboard</button>
            </div>
        </main>`;
    }

    /* ---------- Course View — COMING SOON STYLE ---------- */
    #courseViewPage() {
        const c = this.#courseStore.findById(this.#state.courseViewId);
        if (!c) { this.#state.view = 'courses'; return this.#coursesPage(); }

        const isAdmin = this.#auth.isAdmin;

        return `
        ${this.#appHeader()}
        <main class="soon">
            <div class="soon-icon">📚</div>
            <h1>${App.esc(c.title)}</h1>
            <p>Handled by <b>Member 2</b> · Course code: <code>${App.esc(c.id)}</code></p>

            ${this.#errorBox()}
            ${this.#flashBox()}

            <div class="soon-card">
                <h3>📝 Description</h3>
                <ul>
                    <li style="display:block;text-align:left">${App.esc(c.description)}</li>
                </ul>
            </div>

            <div class="soon-card" style="margin-top:16px">
                <h3>🎯 Course Information</h3>
                <ul>
                    <li>Course ID: ${App.esc(c.id)}</li>
                    <li>Credits: ${c.credits}</li>
                    <li>Lessons: 3</li>
                    <li>Quiz questions: 3</li>
                    <li>Access level: ${isAdmin ? 'Admin' : 'View only'}</li>
                </ul>
            </div>

            <div class="soon-actions">
                ${isAdmin ? `
                    <button class="p big" data-act="course-edit" data-id="${App.esc(c.id)}">✏️ Edit Course</button>
                    <button class="big danger" data-act="course-delete" data-id="${App.esc(c.id)}">🗑 Delete Course</button>
                ` : ''}
                <button class="big ghost" data-act="goto" data-view="courses">← Back to Courses</button>
            </div>
        </main>`;
    }

    /* ---------- Add Course (CREATE — admin only) ---------- */
    #courseAddPage() {
        if (!this.#auth.isAdmin) {
            return `
            ${this.#appHeader()}
            <main class="page">
                <div class="empty" style="margin-top:40px">
                    🔒 <b>Admin access required</b>
                    <p class="mut" style="margin-top:8px">Only administrators can add new courses.</p>
                    <div style="margin-top:16px">
                        <button class="p" data-act="goto" data-view="courses">← Back to Courses</button>
                    </div>
                </div>
            </main>`;
        }

        const f = this.#forms.courseAdd;
        return `
        ${this.#appHeader()}
        <main class="page">
            <div class="pagehead">
                <h1>➕ Add New Course</h1>
                <p class="mut">Member 2 · Saves to <code>courses.txt</code></p>
            </div>

            ${this.#errorBox()}

            <form class="formcard" data-form="courseAdd" autocomplete="off">
                <label>Course ID
                    <input name="id" placeholder="e.g. CRS001"
                           value="${App.esc(f.id !== undefined ? f.id : this.#courseStore.nextId())}">
                </label>

                <label>Course Title
                    <input name="title" maxlength="80"
                           placeholder="e.g. Web Development Basics"
                           value="${App.esc(f.title)}">
                </label>

                <label>Description
                    <textarea name="description" maxlength="300"
                              placeholder="Short description of what this course covers…">${App.esc(f.description)}</textarea>
                </label>

                <label>Credits
                    <input name="credits" type="number" min="1" max="10"
                           placeholder="e.g. 3" value="${App.esc(f.credits !== undefined ? f.credits : 3)}">
                </label>

                <div class="row">
                    <button class="p big" type="submit">➕ Create course</button>
                    <button class="big ghost" type="button" data-act="goto" data-view="courses">Cancel</button>
                </div>
            </form>
        </main>`;
    }

    /* ---------- Edit Course (UPDATE — admin only) ---------- */
    #courseEditPage() {
        if (!this.#auth.isAdmin) {
            return `
            ${this.#appHeader()}
            <main class="page">
                <div class="empty" style="margin-top:40px">
                    🔒 <b>Admin access required</b>
                    <p class="mut" style="margin-top:8px">Only administrators can edit courses.</p>
                    <div style="margin-top:16px">
                        <button class="p" data-act="goto" data-view="courses">← Back to Courses</button>
                    </div>
                </div>
            </main>`;
        }

        const c = this.#courseStore.findById(this.#state.courseEditId);
        if (!c) { this.#state.view = 'courses'; return this.#coursesPage(); }

        const f   = this.#forms.courseEdit;
        const val = (k, fb) => (f[k] !== undefined ? f[k] : fb);

        return `
        ${this.#appHeader()}
        <main class="page">
            <div class="pagehead">
                <h1>✏️ Edit Course</h1>
                <p class="mut">Member 2 · Updating <code>${App.esc(c.id)}</code></p>
            </div>

            ${this.#errorBox()}

            <form class="formcard" data-form="courseEdit" autocomplete="off">
                <label>Course ID
                    <input value="${App.esc(c.id)}" disabled>
                </label>

                <label>Course Title
                    <input name="title" maxlength="80"
                           value="${App.esc(val('title', c.title))}">
                </label>

                <label>Description
                    <textarea name="description" maxlength="300">${App.esc(val('description', c.description))}</textarea>
                </label>

                <label>Credits
                    <input name="credits" type="number" min="1" max="10"
                           value="${App.esc(val('credits', c.credits))}">
                </label>

                <div class="row">
                    <button class="p big" type="submit">💾 Save changes</button>
                    <button class="big ghost" type="button" data-act="goto" data-view="course-view">Cancel</button>
                </div>
            </form>
        </main>`;
    }
}

new App(document.getElementById('root')).start();