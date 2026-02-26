export const INITIAL_DATA = {
  organizations: [
    { id: "org_1", name: "LearnWithAndi Bootcamp" },
    { id: "org_2", name: "Tech Horizons Academy" },
  ],
  admins: [
    {
      id: "admin_1",
      orgId: "org_1",
      email: "test@example.com",
      password: "User#123",
      name: "Test",
    },
    {
      id: "admin_2",
      orgId: "org_2",
      email: "admin2@example.com",
      password: "User#123",
      name: "Admin Two",
    },
  ],
  students: [
    {
      id: "stu_1",
      orgId: "org_1",
      name: "Alice Smith",
      email: "alice@example.com",
      status: "Active",
    },
    {
      id: "stu_2",
      orgId: "org_1",
      name: "Bob Johnson",
      email: "bob@example.com",
      status: "Disabled",
    },
    {
      id: "stu_3",
      orgId: "org_2",
      name: "Charlie Brown",
      email: "charlie@example.com",
      status: "Active",
    },
  ],
  superadmins: [
    {
      id: "super_1",
      email: "superadmin@example.com",
      password: "Superadmin#123",
      name: "Global Superadmin",
      role: "superadmin",
    },
  ],
};

export const initializeMockData = () => {
  if (!localStorage.getItem("hwa_organizations")) {
    localStorage.setItem(
      "hwa_organizations",
      JSON.stringify(INITIAL_DATA.organizations),
    );
  }
  if (!localStorage.getItem("hwa_admins")) {
    // Inject the organizational admin role for previous users implicitly
    const seededAdmins = INITIAL_DATA.admins.map((a) => ({
      ...a,
      role: "admin",
    }));
    localStorage.setItem("hwa_admins", JSON.stringify(seededAdmins));
  }
  if (!localStorage.getItem("hwa_superadmins")) {
    localStorage.setItem(
      "hwa_superadmins",
      JSON.stringify(INITIAL_DATA.superadmins),
    );
  }
  if (!localStorage.getItem("hwa_students")) {
    localStorage.setItem("hwa_students", JSON.stringify(INITIAL_DATA.students));
  }
};

// Start initialization on load
initializeMockData();
