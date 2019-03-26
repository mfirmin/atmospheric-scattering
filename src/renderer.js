
import {
    BufferAttribute,
    BufferGeometry,
    Mesh,
    PerspectiveCamera,
    Scene,
    ShaderMaterial,
    TextureLoader,
    Vector3,
    WebGLRenderer,
} from './lib/three.module';

export class Renderer {
    constructor(width, height) {
        try {
            this.renderer = new WebGLRenderer({
                alpha: true,
            });
        } catch (e) {
            throw new Error('Could not initialize WebGL');
        }
        this.mesh = null;

        this.renderer.setClearColor(0x000000, 1);
        this.renderer.setSize(width, height);

        this.width = width;
        this.height = height;

        this.scene = new Scene();

        this.cameraMovementSpeed = 0.01;
        this.cameraLookSpeed = 0.01;

        this.createCamera();
        this.scene.add(this.camera);
    }

    updateCamera() {
        if (this.forward) {
            const dir = new Vector3().copy(this.cameraDirection);
            this.cameraPosition.add(dir.multiplyScalar(this.cameraMovementSpeed));
        }
        if (this.right) {
            const dir = new Vector3().crossVectors(this.cameraDirection, new Vector3(0, 1, 0));
            this.cameraPosition.add(dir.multiplyScalar(this.cameraMovementSpeed));
        }
        if (this.left) {
            const dir = new Vector3().crossVectors(this.cameraDirection, new Vector3(0, 1, 0));
            this.cameraPosition.add(dir.multiplyScalar(-this.cameraMovementSpeed));
        }
        if (this.back) {
            const dir = new Vector3().copy(this.cameraDirection);
            this.cameraPosition.add(dir.multiplyScalar(-this.cameraMovementSpeed));
        }


        const target = new Vector3().addVectors(this.cameraDirection, this.cameraPosition);

        this.camera.position.set(
            this.cameraPosition.x,
            this.cameraPosition.y,
            this.cameraPosition.z,
        );
        this.camera.lookAt(target.x, target.y, target.z);
    }

    createCamera() {
        this.camera = new PerspectiveCamera(45, this.width / this.height, 0.001, 10.0);

        this.cameraPosition = new Vector3(-1, 0.4, 0);
        this.cameraDirection = new Vector3(1, 0, 0);

        this.updateCamera();

        let last = null;

        let ha = 0;
        let va = 0;

        const vLimit = 1.50;
        document.addEventListener('mousedown', (e) => {
            last = [e.pageX, e.pageY];
        });
        document.addEventListener('mousemove', (e) => {
            if (last !== null) {
                const delta = [e.pageX - last[0], e.pageY - last[1]];
                last = [e.pageX, e.pageY];

                ha += this.cameraLookSpeed * delta[0];
                va -= this.cameraLookSpeed * delta[1];
                if (va > vLimit) { va = vLimit; }
                if (va < -vLimit) { va = -vLimit; }

                this.cameraDirection.set(
                    Math.cos(ha) * Math.cos(va),
                    Math.sin(va),
                    Math.sin(ha) * Math.cos(va),
                );
            }
        });
        document.addEventListener('mouseup', () => {
            last = null;
        });

        this.forward = false;
        this.right = false;
        this.left = false;
        this.back = false;
        document.addEventListener('keydown', (e) => {
            if (e.key === 'w') {
                this.forward = true;
            } else if (e.key === 'd') {
                this.right = true;
            } else if (e.key === 's') {
                this.back = true;
            } else if (e.key === 'a') {
                this.left = true;
            }
        });
        document.addEventListener('keyup', (e) => {
            if (e.key === 'w') {
                this.forward = false;
            } else if (e.key === 'd') {
                this.right = false;
            } else if (e.key === 's') {
                this.back = false;
            } else if (e.key === 'a') {
                this.left = false;
            }
        });
    }

    setSize(width, height) {
        this.width = width;
        this.height = height;

        this.renderer.setSize(width, height);
    }

    render() {
        this.updateCamera();
        this.renderer.render(this.scene, this.camera);
    }

    createShader() {
        const texture = new TextureLoader().load('/static/images/volcano_color.png');

        const shader = new ShaderMaterial({
            uniforms: {
                map: { type: 't', value: texture },
                sunDirection: { type: 'v3', value: new Vector3(0, 1, 0) },
                sunColor: { type: 'v3', value: new Vector3(1.0, 1.0, 1.0) },
                sunAmbientCoefficient: { type: 'f', value: 0.2 },
            },
            vertexShader: `
                varying vec3 vPositionEyespace;
                varying vec3 vNormalEyespace;
                varying vec2 vUV;

                void main() {
                    vPositionEyespace = (modelViewMatrix * vec4(position, 1.0)).xyz;
                    vNormalEyespace = (modelViewMatrix * vec4(normalize(normal), 0.0)).xyz;
                    vUV = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                varying vec3 vPositionEyespace;
                varying vec3 vNormalEyespace;
                varying vec2 vUV;

                uniform sampler2D map;

                uniform vec3 sunDirection;
                uniform vec3 sunColor;
                uniform float sunAmbientCoefficient;

                vec3 illuminate(vec3 inColor, vec3 P, vec3 N, vec3 E) {
                    vec3 L = normalize((viewMatrix * vec4(sunDirection, 0.0)).xyz);
                    float attenuation = 1.0;

                    vec3 ambient = sunAmbientCoefficient * inColor * sunColor;

                    float diffuseCoefficient = max(0.0, dot(N, L));
                    vec3 diffuse = diffuseCoefficient * inColor * sunColor;

                    float specularCoefficient = 0.0;
                    vec3 specular = vec3(0.0);

                    vec3 outColor = ambient + attenuation * (diffuse + specular);

                    return outColor;
                }

                void main() {
                    vec4 color = texture2D(map, vUV);

                    vec3 N = normalize(vNormalEyespace);
                    vec3 E = normalize(-vPositionEyespace.xyz);

                    gl_FragColor = vec4(illuminate(color.rgb, vPositionEyespace.xyz, N, E), 1.0);
                }
            `,
        });

        return shader;
    }

    loadMesh(data) {
        const rawVertices = data.meshes[0].vertices;
        const rawNormals = data.meshes[0].normals;
        const rawFaces = data.meshes[0].faces;
        const rawUVs = data.meshes[0].texturecoords[0];

        const numFaces = rawFaces.length;
        const numVertices = numFaces * 3;

        const geom = new BufferGeometry();

        const vs = new Float32Array(numVertices * 3);
        const ns = new Float32Array(numVertices * 3);
        const uvs = new Float32Array(numVertices * 2);

        // [-795.5, -123.399, -795.5]
        // [795.5, 123.4, 795.5]
        let y = 0;
        for (let i = 0; i < numFaces; i++) {
            const fa = rawFaces[i][0];
            const fb = rawFaces[i][1];
            const fc = rawFaces[i][2];

            const A = new Vector3(
                rawVertices[(fa * 3) + 0],
                rawVertices[(fa * 3) + 1],
                rawVertices[(fa * 3) + 2],
            );

            const B = new Vector3(
                rawVertices[(fb * 3) + 0],
                rawVertices[(fb * 3) + 1],
                rawVertices[(fb * 3) + 2],
            );

            const C = new Vector3(
                rawVertices[(fc * 3) + 0],
                rawVertices[(fc * 3) + 1],
                rawVertices[(fc * 3) + 2],
            );

            const AB = new Vector3().subVectors(B, A).normalize();
            const AC = new Vector3().subVectors(C, A).normalize();

            const N = new Vector3().crossVectors(AB, AC).normalize();

            vs[(i * 9) + 0] = A.x;
            vs[(i * 9) + 1] = A.y;
            vs[(i * 9) + 2] = A.z;

            vs[(i * 9) + 3] = B.x;
            vs[(i * 9) + 4] = B.y;
            vs[(i * 9) + 5] = B.z;

            vs[(i * 9) + 6] = C.x;
            vs[(i * 9) + 7] = C.y;
            vs[(i * 9) + 8] = C.z;

//            ns[(i * 9) + 0] = N.x;
//            ns[(i * 9) + 1] = N.y;
//            ns[(i * 9) + 2] = N.z;
//
//            ns[(i * 9) + 3] = N.x;
//            ns[(i * 9) + 4] = N.y;
//            ns[(i * 9) + 5] = N.z;
//
//            ns[(i * 9) + 6] = N.x;
//            ns[(i * 9) + 7] = N.y;
//            ns[(i * 9) + 8] = N.z;

            ns[(i * 9) + 0] = rawNormals[(fa * 3) + 0];
            ns[(i * 9) + 1] = rawNormals[(fa * 3) + 1];
            ns[(i * 9) + 2] = rawNormals[(fa * 3) + 2];

            ns[(i * 9) + 3] = rawNormals[(fb * 3) + 0];
            ns[(i * 9) + 4] = rawNormals[(fb * 3) + 1];
            ns[(i * 9) + 5] = rawNormals[(fb * 3) + 2];

            ns[(i * 9) + 6] = rawNormals[(fc * 3) + 0];
            ns[(i * 9) + 7] = rawNormals[(fc * 3) + 1];
            ns[(i * 9) + 8] = rawNormals[(fc * 3) + 2];

            uvs[(i * 6) + 0] = rawUVs[(fa * 2) + 0];
            uvs[(i * 6) + 1] = rawUVs[(fa * 2) + 1];

            uvs[(i * 6) + 2] = rawUVs[(fb * 2) + 0];
            uvs[(i * 6) + 3] = rawUVs[(fb * 2) + 1];

            uvs[(i * 6) + 4] = rawUVs[(fc * 2) + 0];
            uvs[(i * 6) + 5] = rawUVs[(fc * 2) + 1];
        }

        geom.addAttribute('position', new BufferAttribute(vs, 3));
        geom.addAttribute('normal', new BufferAttribute(ns, 3));
        geom.addAttribute('uv', new BufferAttribute(uvs, 2));

        const shader = this.createShader();
        const mesh = new Mesh(geom, shader);

        this.mesh = mesh;

        this.scene.add(mesh);
    }
}
