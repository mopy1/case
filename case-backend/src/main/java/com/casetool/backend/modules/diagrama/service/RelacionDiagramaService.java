package com.casetool.backend.modules.diagrama.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import com.casetool.backend.core.exception.ResourceNotFoundException;
import com.casetool.backend.modules.diagrama.dto.ActualizarPuntosControlRequest;
import com.casetool.backend.modules.diagrama.dto.AtributoEntidadRequest;
import com.casetool.backend.modules.diagrama.dto.EntidadDiagramaRequest;
import com.casetool.backend.modules.diagrama.dto.EntidadDiagramaResponse;
import com.casetool.backend.modules.diagrama.dto.RelacionDiagramaRequest;
import com.casetool.backend.modules.diagrama.dto.RelacionDiagramaResponse;
import com.casetool.backend.modules.diagrama.model.EntidadDiagrama;
import com.casetool.backend.modules.diagrama.model.PuntoControl;
import com.casetool.backend.modules.diagrama.model.RelacionDiagrama;
import com.casetool.backend.modules.diagrama.repository.RelacionDiagramaRepository;
import com.casetool.backend.modules.proyecto.model.MiembroProyecto;
import com.casetool.backend.modules.proyecto.model.Proyecto;
import com.casetool.backend.modules.proyecto.repository.ProyectoRepository;
import com.casetool.backend.modules.proyecto.service.ProyectoAccesoService;

@Service
@Transactional
public class RelacionDiagramaService {

    private final RelacionDiagramaRepository relacionDiagramaRepository;
    private final ProyectoRepository proyectoRepository;
    private final EntidadDiagramaService entidadDiagramaService;
    private final AtributoEntidadService atributoEntidadService;
    private final ProyectoAccesoService accesoService;

    public RelacionDiagramaService(
            RelacionDiagramaRepository relacionDiagramaRepository,
            ProyectoRepository proyectoRepository,
            EntidadDiagramaService entidadDiagramaService,
            AtributoEntidadService atributoEntidadService,
            ProyectoAccesoService accesoService) {
        this.relacionDiagramaRepository = relacionDiagramaRepository;
        this.proyectoRepository = proyectoRepository;
        this.entidadDiagramaService = entidadDiagramaService;
        this.atributoEntidadService = atributoEntidadService;
        this.accesoService = accesoService;
    }

    public RelacionDiagramaResponse crear(Long proyectoId, RelacionDiagramaRequest request, Long usuarioId) {
        RelacionDiagrama relacion = crearRelacionCruda(proyectoId, request, usuarioId);

        if (relacion.esMuchosAMuchos()) {
            crearTablaIntermedia(proyectoId, relacion.getProyecto(), relacion.getEntidadOrigen(), relacion.getEntidadDestino(), usuarioId);
        }

        return RelacionDiagramaResponse.from(relacion);
    }

    /**
     * Igual que {@link #crear} pero sin la auto-creación de tabla intermedia — usado por la
     * importación XMI (2026-09-20): el archivo ya trae la tabla intermedia y sus 2 relaciones
     * físicas como entidades/relaciones normales (son parte del esquema real que se exportó),
     * así que reconstruirlas de nuevo acá duplicaría la tabla intermedia.
     */
    public RelacionDiagramaResponse crearSinTablaIntermedia(Long proyectoId, RelacionDiagramaRequest request, Long usuarioId) {
        return RelacionDiagramaResponse.from(crearRelacionCruda(proyectoId, request, usuarioId));
    }

    private RelacionDiagrama crearRelacionCruda(Long proyectoId, RelacionDiagramaRequest request, Long usuarioId) {
        MiembroProyecto miembro = accesoService.verificarMiembro(proyectoId, usuarioId);
        accesoService.verificarPuedeEscribir(miembro);

        Proyecto proyecto = proyectoRepository.findById(proyectoId)
                .orElseThrow(() -> new ResourceNotFoundException("Proyecto no encontrado"));

        EntidadDiagrama origen = entidadDiagramaService.buscarEntidad(request.entidadOrigenId());
        EntidadDiagrama destino = entidadDiagramaService.buscarEntidad(request.entidadDestinoId());
        verificarPertenecenAlProyecto(proyectoId, origen, destino);

        RelacionDiagrama relacion = new RelacionDiagrama();
        relacion.setProyecto(proyecto);
        relacion.setEntidadOrigen(origen);
        relacion.setEntidadDestino(destino);
        relacion.setMultiplicidadOrigen(request.multiplicidadOrigen());
        relacion.setMultiplicidadDestino(request.multiplicidadDestino());
        relacion.setTipo(request.tipo() != null ? request.tipo() : RelacionDiagrama.TipoRelacionUml.ASOCIACION);
        relacionDiagramaRepository.save(relacion);
        return relacion;
    }

    /**
     * Edita una relación existente. Cada lado se edita de forma independiente desde el lienzo
     * (click en el "(1..*)" de esa punta), así que una relación puede llegar a MUCHOS_A_MUCHOS de
     * forma incremental (primero un lado, después el otro) en vez de elegirse de una sola vez.
     * Por eso SÍ dispara la creación de la tabla intermedia cuando la edición hace que la
     * relación pase a ser N:M y no lo era ya — así el resultado es el mismo sin importar si el
     * N:M se armó al crear la relación o editando cada punta por separado. Si ya era N:M y se
     * guarda de nuevo (p.ej. solo cambió el opcional de un lado), no se repite: ya tiene tabla
     * intermedia.
     */
    public RelacionDiagramaResponse actualizar(Long relacionId, RelacionDiagramaRequest request, Long usuarioId) {
        RelacionDiagrama relacion = relacionDiagramaRepository.findById(relacionId)
                .orElseThrow(() -> new ResourceNotFoundException("Relación no encontrada"));
        Long proyectoId = relacion.getProyecto().getId();
        MiembroProyecto miembro = accesoService.verificarMiembro(proyectoId, usuarioId);
        accesoService.verificarPuedeEscribir(miembro);

        EntidadDiagrama origen = entidadDiagramaService.buscarEntidad(request.entidadOrigenId());
        EntidadDiagrama destino = entidadDiagramaService.buscarEntidad(request.entidadDestinoId());
        verificarPertenecenAlProyecto(proyectoId, origen, destino);

        boolean eraMuchosAMuchos = relacion.esMuchosAMuchos();
        Proyecto proyecto = relacion.getProyecto();

        relacion.setEntidadOrigen(origen);
        relacion.setEntidadDestino(destino);
        relacion.setMultiplicidadOrigen(request.multiplicidadOrigen());
        relacion.setMultiplicidadDestino(request.multiplicidadDestino());
        if (request.tipo() != null) {
            relacion.setTipo(request.tipo());
        }
        RelacionDiagrama guardada = relacionDiagramaRepository.save(relacion);

        if (guardada.esMuchosAMuchos() && !eraMuchosAMuchos) {
            crearTablaIntermedia(proyectoId, proyecto, origen, destino, usuarioId);
        }

        return RelacionDiagramaResponse.from(guardada);
    }

    /**
     * Una relación N:M no existe como columna física en un esquema relacional real — se resuelve
     * con una tabla intermedia y dos FK 1:N. Se crea sola al elegir MUCHOS_A_MUCHOS para que el
     * modelo quede físicamente correcto de entrada: el generador de backend (Fase 4) necesita
     * columnas FK reales para armar `@ManyToOne`/`@JoinColumn`, no puede partir de un enum de
     * tipo de relación. La relación N:M elegida por el usuario se deja tal cual (documenta la
     * intención original en el lienzo); esto solo agrega su realización física al lado.
     */
    private void crearTablaIntermedia(
            Long proyectoId, Proyecto proyecto, EntidadDiagrama origen, EntidadDiagrama destino, Long usuarioId) {
        // N:M recursiva (origen y destino son la misma entidad, ej. "empleado" relacionado con
        // "empleado" — una red de contactos, no una jerarquía simple que sería 1:N). Sin este
        // caso aparte, las 2 columnas FK se llamarían igual ("empleado_id" las dos) y la segunda
        // `agregar()` de abajo rompería con un 409 de nombre duplicado.
        boolean esRecursiva = origen.getId().equals(destino.getId());
        String nombreBase = origen.getNombre() + "_" + destino.getNombre();
        String nombre = nombreBase;
        int sufijo = 2;
        while (entidadDiagramaService.existeNombre(proyectoId, nombre)) {
            nombre = nombreBase + "_" + sufijo++;
        }

        // Recursiva: si se centra en X igual que la tabla origen (como en el caso normal), la
        // tabla intermedia queda justo debajo del lazo de la relación recursiva — la línea de
        // "clase de asociación" termina pasando por arriba de la tabla origen para llegar. Se
        // corre al costado en vez de centrar para que quede libre.
        double posX = esRecursiva ? origen.getPosX() + 350 : (origen.getPosX() + destino.getPosX()) / 2;
        double posY = Math.max(origen.getPosY(), destino.getPosY()) + 220;

        EntidadDiagramaResponse tablaIntermedia = entidadDiagramaService.crear(
                proyectoId, new EntidadDiagramaRequest(nombre, posX, posY), usuarioId);

        String columnaOrigen = esRecursiva ? origen.getNombre() + "_origen_id" : origen.getNombre() + "_id";
        String columnaDestino = esRecursiva ? destino.getNombre() + "_destino_id" : destino.getNombre() + "_id";
        atributoEntidadService.agregar(tablaIntermedia.id(), new AtributoEntidadRequest(
                columnaOrigen, "BIGINT", true, true, origen.getId(), false), usuarioId);
        atributoEntidadService.agregar(tablaIntermedia.id(), new AtributoEntidadRequest(
                columnaDestino, "BIGINT", true, true, destino.getId(), false), usuarioId);

        EntidadDiagrama junction = entidadDiagramaService.buscarEntidad(tablaIntermedia.id());
        crearRelacionFisica(proyecto, origen, junction);
        crearRelacionFisica(proyecto, destino, junction);
    }

    private void crearRelacionFisica(Proyecto proyecto, EntidadDiagrama unLado, EntidadDiagrama junction) {
        RelacionDiagrama fisica = new RelacionDiagrama();
        fisica.setProyecto(proyecto);
        fisica.setEntidadOrigen(unLado);
        fisica.setEntidadDestino(junction);
        fisica.setMultiplicidadOrigen(RelacionDiagrama.Multiplicidad.UNO);
        fisica.setMultiplicidadDestino(RelacionDiagrama.Multiplicidad.UNO_O_MAS);
        relacionDiagramaRepository.save(fisica);
    }

    /**
     * Reemplaza la lista completa de puntos de control de una relación — el frontend manda
     * siempre la lista entera actualizada (agregar/mover/quitar un punto son la misma operación
     * acá), no hay endpoints separados por punto individual.
     */
    public RelacionDiagramaResponse actualizarPuntosControl(Long relacionId, ActualizarPuntosControlRequest request, Long usuarioId) {
        RelacionDiagrama relacion = relacionDiagramaRepository.findById(relacionId)
                .orElseThrow(() -> new ResourceNotFoundException("Relación no encontrada"));
        MiembroProyecto miembro = accesoService.verificarMiembro(relacion.getProyecto().getId(), usuarioId);
        accesoService.verificarPuedeEscribir(miembro);

        List<PuntoControl> puntos = request.puntos().stream()
                .map(p -> new PuntoControl(p.x(), p.y()))
                .toList();
        relacion.setPuntosControl(puntos);
        relacionDiagramaRepository.save(relacion);
        return RelacionDiagramaResponse.from(relacion);
    }

    public void eliminar(Long relacionId, Long usuarioId) {
        RelacionDiagrama relacion = relacionDiagramaRepository.findById(relacionId)
                .orElseThrow(() -> new ResourceNotFoundException("Relación no encontrada"));
        MiembroProyecto miembro = accesoService.verificarMiembro(relacion.getProyecto().getId(), usuarioId);
        accesoService.verificarPuedeEscribir(miembro);

        relacionDiagramaRepository.delete(relacion);
    }

    private void verificarPertenecenAlProyecto(Long proyectoId, EntidadDiagrama origen, EntidadDiagrama destino) {
        if (!origen.getProyecto().getId().equals(proyectoId) || !destino.getProyecto().getId().equals(proyectoId)) {
            throw new IllegalArgumentException("Las entidades de la relación deben pertenecer a este proyecto");
        }
    }
}
