// @ts-ignore
import React from "react";
// @ts-ignore
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
// @ts-ignore
import { Container } from "@mui/material";
import Header from "./pages/Header";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import UnderWaterSystem from "./pages/UnderWaterSystem";
import DataCenter from "./pages/DataCenter";
import AdminManagement from "./pages/AdminManagement";
import Profile from "./pages/Profile";
import Home from "./pages/Home";
import IntelligentCenter from "./pages/IntelligentCenter";
import PrivateRoute from "./components/PrivateRoute";
import { AuthProvider } from "./auth/AuthContext";

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Header />
        <Container maxWidth={false} sx={{ mt: 4 }}>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/main-info" element={
              <PrivateRoute>
                <Home />
              </PrivateRoute>
            } />
            <Route path="/underwater" element={
              <PrivateRoute>
                <UnderWaterSystem />
              </PrivateRoute>
            } />
            <Route path="/data-center" element={
              <PrivateRoute>
                <DataCenter />
              </PrivateRoute>
            } />
            <Route path="/admin" element={
              <PrivateRoute>
                <AdminManagement />
              </PrivateRoute>
            } />
            <Route path="/intelligent" element={
              <PrivateRoute>
                <IntelligentCenter />
              </PrivateRoute>
            } />
            <Route path="/profile" element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            } />
          </Routes>
        </Container>
      </Router>
    </AuthProvider>
  );
};

export default App;