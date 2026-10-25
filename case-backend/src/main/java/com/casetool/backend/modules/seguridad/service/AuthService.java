package com.casetool.backend.modules.seguridad.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.casetool.backend.core.exception.ResourceNotFoundException;
import com.casetool.backend.core.security.JwtService;
import com.casetool.backend.modules.seguridad.dto.AuthResponse;
import com.casetool.backend.modules.seguridad.dto.LoginRequest;
import com.casetool.backend.modules.seguridad.dto.RegisterRequest;
import com.casetool.backend.modules.seguridad.dto.UsuarioResponse;
import com.casetool.backend.modules.seguridad.exception.CredencialesInvalidasException;
import com.casetool.backend.modules.seguridad.exception.RecursoDuplicadoException;
import com.casetool.backend.modules.seguridad.model.Usuario;
import com.casetool.backend.modules.seguridad.repository.UsuarioRepository;

@Service
@Transactional
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public AuthResponse login(LoginRequest request) {
        Usuario usuario = usuarioRepository
                .findByUsernameOrEmail(request.usernameOrEmail(), request.usernameOrEmail())
                .orElseThrow(() -> new CredencialesInvalidasException("Credenciales incorrectas"));

        if (!passwordEncoder.matches(request.password(), usuario.getPassword())) {
            throw new CredencialesInvalidasException("Credenciales incorrectas");
        }

        return respuestaConToken(usuario);
    }

    public AuthResponse register(RegisterRequest request) {
        if (usuarioRepository.existsByUsername(request.username())) {
            throw new RecursoDuplicadoException("El username ya existe");
        }
        if (usuarioRepository.existsByEmail(request.email())) {
            throw new RecursoDuplicadoException("El email ya existe");
        }

        Usuario usuario = new Usuario();
        usuario.setUsername(request.username());
        usuario.setEmail(request.email());
        usuario.setPassword(passwordEncoder.encode(request.password()));
        usuarioRepository.save(usuario);

        return respuestaConToken(usuario);
    }

    @Transactional(readOnly = true)
    public UsuarioResponse getPerfil(String username) {
        Usuario usuario = usuarioRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado: " + username));
        return UsuarioResponse.from(usuario);
    }

    /** Login y registro responden lo mismo: datos basicos del usuario + un JWT nuevo. */
    private AuthResponse respuestaConToken(Usuario usuario) {
        String token = jwtService.generateToken(usuario.getId(), usuario.getUsername());
        return new AuthResponse(usuario.getId(), usuario.getUsername(), usuario.getEmail(), token);
    }
}
