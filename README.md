# 🏦 Bank Loan Simulator

Sistema web completo para la gestión y simulación de préstamos bancarios, desarrollado con arquitectura de capas y tecnologías modernas.

## 📋 Descripción del Proyecto

**Bank Loan Simulator** es una aplicación fullstack que permite a los usuarios solicitar préstamos bancarios y a los administradores gestionar dichas solicitudes. El sistema implementa autenticación JWT, cálculos financieros precisos y una interfaz intuitiva para una experiencia de usuario óptima.

### Funcionalidades Principales

#### Para Usuarios:
- ✅ Registro e inicio de sesión con autenticación JWT
- ✅ Solicitud de préstamos con cálculo automático de cuota mensual
- ✅ Visualización de historial de préstamos propios
- ✅ Seguimiento del estado de solicitudes (Pendiente, Aprobado, Rechazado)

#### Para Administradores:
- ✅ Vista consolidada de todas las solicitudes de préstamos
- ✅ Aprobación o rechazo de solicitudes con comentarios
- ✅ Gestión completa del ciclo de vida de los préstamos

### Cálculos Financieros

El sistema implementa la fórmula francesa de amortización para calcular la cuota mensual:

```
Cuota Mensual = P × [r(1 + r)^n] / [(1 + r)^n - 1]

Donde:
- P = Monto del préstamo
- r = Tasa de interés mensual (tasa anual / 12 / 100)
- n = Número de cuotas (meses)
```

---

## 🛠️ Tecnologías Utilizadas

### Backend
- **.NET 8.0** - Framework principal para la API RESTful
- **Entity Framework Core** - ORM para gestión de datos
- **ASP.NET Core Identity** - Sistema de autenticación y autorización
- **JWT (JSON Web Tokens)** - Autenticación segura basada en tokens
- **Swagger/OpenAPI** - Documentación interactiva de la API
- **In-Memory Database** - Base de datos en memoria para desarrollo (configurable a SQL Server)

### Frontend
- **React 19.2** - Biblioteca principal para la interfaz de usuario
- **TypeScript** - Tipado estático para mayor robustez
- **Vite 7.2** - Herramienta de build y desarrollo de alto rendimiento
- **Material-UI (MUI)** - Biblioteca de componentes con diseño Material Design
- **React Router DOM** - Enrutamiento declarativo
- **Axios** - Cliente HTTP para comunicación con la API

### Herramientas de Desarrollo
- **ESLint** - Linter para mantener calidad del código JavaScript/TypeScript
- **TypeScript Compiler** - Compilador de TypeScript

---

## 🏗️ Arquitectura del Sistema

### Backend: Arquitectura en Capas (Clean Architecture)

El backend implementa una arquitectura en capas que separa responsabilidades y facilita el mantenimiento:

```
┌─────────────────────────────────────────────────┐
│           BankLoanSimulator.API                 │
│  (Capa de Presentación - Controllers)           │
│  - AuthController                               │
│  - LoansController                              │
│  - Configuración JWT, CORS, Swagger             │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│       BankLoanSimulator.Application             │
│  (Capa de Aplicación - Lógica de Negocio)      │
│  - Services: AuthService, LoanService           │
│  - DTOs: AuthDTOs, LoanDTOs, UserDTOs           │
│  - Interfaces: IAuthService, ILoanService       │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│      BankLoanSimulator.Infrastructure           │
│  (Capa de Infraestructura - Acceso a Datos)    │
│  - Repositories: UserRepository, LoanRepository │
│  - DbContext: ApplicationDbContext              │
│  - Configuración de Entity Framework            │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│         BankLoanSimulator.Domain                │
│  (Capa de Dominio - Entidades y Reglas)        │
│  - Entities: User, Loan                         │
│  - Enums: LoanStatusEnum (Pending, Approved,   │
│           Rejected)                             │
└─────────────────────────────────────────────────┘
```

#### Principios Aplicados:
- **Separación de Responsabilidades**: Cada capa tiene un propósito específico
- **Inversión de Dependencias**: Las capas superiores dependen de abstracciones (interfaces)
- **Repository Pattern**: Abstracción del acceso a datos
- **Service Pattern**: Encapsulación de lógica de negocio

### Frontend: Arquitectura por Componentes

```
frontend/bank-loan-simulator-ui/src/
├── api/              # Servicios HTTP y configuración de axios
├── auth/             # Contexto y gestión de autenticación
├── components/       # Componentes reutilizables
├── pages/            # Páginas/Vistas principales
│   ├── Login.tsx
│   ├── RequestLoan.tsx
│   ├── UserLoans.tsx
│   └── AdminLoans.tsx
├── types/            # Definiciones TypeScript
├── App.tsx           # Componente raíz y enrutamiento
└── main.tsx          # Punto de entrada
```

---

## 🚀 Instalación y Ejecución

### Prerrequisitos

Asegúrate de tener instalado:
- [.NET 8.0 SDK](https://dotnet.microsoft.com/download/dotnet/8.0) o superior
- [Node.js](https://nodejs.org/) v18+ y npm
- [Git](https://git-scm.com/)
- Un IDE recomendado: Visual Studio 2022, VS Code o Rider

---

### 📦 Paso 1: Clonar el Repositorio

```bash
git clone https://github.com/Hitomiblood/BankLoanSimulator
cd BankLoanSimulator
```

---

### 🔧 Paso 2: Configuración del Backend

#### 2.1. Navegar a la carpeta del backend
```bash
cd backend
```

#### 2.2. Restaurar dependencias de .NET
```bash
dotnet restore
```

#### 2.3. Compilar el proyecto
```bash
dotnet build
```

#### 2.4. (Opcional) Configurar appsettings.json

Si deseas usar SQL Server en lugar de la base de datos en memoria, edita el archivo:
`backend/BankLoanSimulator.API/appsettings.json`

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=BankLoanSimulatorDb;Trusted_Connection=True;TrustServerCertificate=True"
  },
  "Jwt": {
    "Secret": "tu-super-secreto-seguro-de-al-menos-32-caracteres",
    "Issuer": "BankLoanSimulator",
    "ExpirationDays": 30
  }
}
```

Y en `Program.cs`, descomenta las líneas de SQL Server:
```csharp
// Cambiar de:
options.UseInMemoryDatabase("BankLoanSimulatorDb");

// A:
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
options.UseSqlServer(connectionString);
```

#### 2.5. Ejecutar la API
```bash
cd BankLoanSimulator.API
dotnet run
```

✅ La API estará disponible en: **http://localhost:5286**

✅ Swagger UI disponible en: **http://localhost:5286/swagger**

---

### 🎨 Paso 3: Configuración del Frontend

#### 3.1. Navegar a la carpeta del frontend
Abre una nueva terminal y ejecuta:
```bash
cd frontend/bank-loan-simulator-ui
```

#### 3.2. Instalar dependencias
```bash
npm install
```

#### 3.3. Ejecutar la aplicación frontend
```bash
npm run dev
```

✅ La aplicación frontend estará disponible en: **http://localhost:5173**

---

### ✅ Paso 4: Verificación

1. **Backend**: Abre http://localhost:5286/swagger y verifica que la documentación de la API carga correctamente
2. **Frontend**: Abre http://localhost:5173 y deberías ver la pantalla de login
3. **Prueba de integración**: Registra un nuevo usuario desde el frontend y solicita un préstamo

---

## 👤 Usuarios por Defecto

El sistema inicializa con usuarios de prueba:

### Usuario Regular
- **Email**: `usuario@example.com`
- **Password**: `123`

### Administrador
- **Email**: `admin@test.com`
- **Password**: `123`

---

## 📚 Uso de la API (Swagger)

### Endpoints Principales

#### Autenticación
- `POST /api/Auth/register` - Registro de nuevos usuarios
- `POST /api/Auth/login` - Inicio de sesión (retorna JWT)

#### Préstamos
- `POST /api/Loans` - Crear solicitud de préstamo (requiere autenticación)
- `GET /api/Loans/my-loans` - Obtener préstamos del usuario autenticado
- `GET /api/Loans` - Obtener todos los préstamos (solo admin)
- `GET /api/Loans/{id}` - Obtener préstamo por ID
- `PUT /api/Loans/{id}/review` - Aprobar/Rechazar préstamo (solo admin)
- `DELETE /api/Loans/{id}` - Eliminar préstamo (solo admin)

### Autenticación con JWT

Para usar endpoints protegidos en Swagger:
1. Inicia sesión con `POST /api/Auth/login`
2. Copia el `token` de la respuesta
3. Haz clic en el botón "Authorize" en Swagger
4. Ingresa: `Bearer {tu-token-aquí}`
5. Haz clic en "Authorize" y luego "Close"

---

## 🧪 Ejecutar Tests

```bash
cd backend/BankLoanSimulator.Tests
dotnet test
```

---

## 📦 Compilar para Producción

### Backend
```bash
cd backend/BankLoanSimulator.API
dotnet publish -c Release -o ./publish
```

### Frontend
```bash
cd frontend/bank-loan-simulator-ui
npm run build
```
El build estará en `frontend/bank-loan-simulator-ui/dist`

---

## 🔒 Seguridad Implementada

- ✅ Hashing de contraseñas con BCrypt
- ✅ Tokens JWT con expiración configurable
- ✅ Validación de roles (User/Admin)
- ✅ CORS configurado para orígenes específicos
- ✅ Validación de datos en backend y frontend
- ✅ HTTPS recomendado para producción

---

## 🌐 Variables de Entorno

### Backend (appsettings.json)
```json
{
  "Jwt": {
    "Secret": "cambia-esto-en-produccion",
    "Issuer": "BankLoanSimulator",
    "ExpirationDays": 30
  }
}
```

### Frontend (opcional - crear .env)
```env
VITE_API_URL=http://localhost:5286/api
```

---

## 📝 Estructura de Datos

### Entidad User
```csharp
{
  "id": "guid",
  "fullName": "string",
  "email": "string",
  "role": "User | Admin",
  "loans": [Loan]
}
```

### Entidad Loan
```csharp
{
  "id": "guid",
  "amount": "decimal",
  "interestRate": "decimal",
  "termInMonths": "int",
  "monthlyPayment": "decimal",
  "status": "Pending | Approved | Rejected",
  "requestDate": "DateTime",
  "reviewDate": "DateTime?",
  "adminComments": "string?",
  "userId": "guid"
}
```

---

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:
1. Haz fork del proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 📄 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

---

## 👨‍💻 Autor

**Miguel Santiago Gómez**
- Email: miguelsantiago1999@hotmail.com
- GitHub: [GitHub](https://github.com/Hitomiblood)

---

## 📞 Soporte

Si tienes alguna pregunta o problema, por favor abre un issue en el repositorio.

---

## 🎯 Roadmap

### Funcionalidades Futuras
- [ ] Implementar paginación en listados
- [ ] Agregar filtros avanzados de búsqueda
- [ ] Sistema de notificaciones por email
- [ ] Dashboard con estadísticas y gráficos
- [ ] Exportación de reportes en PDF/Excel
- [ ] Integración con pasarelas de pago
- [ ] Calculadora de préstamos interactiva
- [ ] Histórico de cambios en préstamos
- [ ] Sistema de mensajería interna
- [ ] Modo oscuro en el frontend

---

¡Gracias por usar Bank Loan Simulator! 🚀
