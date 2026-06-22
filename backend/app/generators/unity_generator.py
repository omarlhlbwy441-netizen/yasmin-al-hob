"""
🎮 Unity/Unreal Generator
"""
from typing import Dict, List
import json


class UnityGenerator:
    """Generate Unity game project files."""

    @staticmethod
    def generate_project(name: str, config: Dict = None) -> Dict:
        """Generate Unity C# scripts and project config."""
        config = config or {}

        files = {
            "Assets/Scripts/GameManager.cs": """using UnityEngine;
using UnityEngine.SceneManagement;

public class GameManager : MonoBehaviour
{
    public static GameManager Instance { get; private set; }

    [SerializeField] private bool _isPaused = false;
    public bool IsPaused => _isPaused;

    private void Awake()
    {
        if (Instance == null)
        {
            Instance = this;
            DontDestroyOnLoad(gameObject);
        }
        else
        {
            Destroy(gameObject);
        }
    }

    public void PauseGame()
    {
        _isPaused = true;
        Time.timeScale = 0f;
    }

    public void ResumeGame()
    {
        _isPaused = false;
        Time.timeScale = 1f;
    }

    public void RestartLevel()
    {
        SceneManager.LoadScene(SceneManager.GetActiveScene().buildIndex);
    }

    public void LoadLevel(string levelName)
    {
        SceneManager.LoadScene(levelName);
    }
}
""",

            "Assets/Scripts/PlayerController.cs": """using UnityEngine;

[RequireComponent(typeof(Rigidbody))]
public class PlayerController : MonoBehaviour
{
    [SerializeField] private float _moveSpeed = 5f;
    [SerializeField] private float _jumpForce = 10f;
    [SerializeField] private LayerMask _groundLayer;

    private Rigidbody _rb;
    private bool _isGrounded;
    private Vector3 _movement;

    private void Start()
    {
        _rb = GetComponent<Rigidbody>();
    }

    private void Update()
    {
        float horizontal = Input.GetAxis("Horizontal");
        float vertical = Input.GetAxis("Vertical");

        _movement = new Vector3(horizontal, 0, vertical).normalized;

        if (Input.GetButtonDown("Jump") && _isGrounded)
        {
            _rb.AddForce(Vector3.up * _jumpForce, ForceMode.Impulse);
        }
    }

    private void FixedUpdate()
    {
        if (GameManager.Instance != null && GameManager.Instance.IsPaused) return;

        _rb.MovePosition(transform.position + _movement * _moveSpeed * Time.fixedDeltaTime);
    }

    private void OnCollisionStay(Collision collision)
    {
        _isGrounded = (_groundLayer.value & (1 << collision.gameObject.layer)) != 0;
    }
}
""",

            "Assets/Scripts/EnemyAI.cs": """using UnityEngine;
using UnityEngine.AI;

[RequireComponent(typeof(NavMeshAgent))]
public class EnemyAI : MonoBehaviour
{
    public enum AIState { Patrol, Chase, Attack }

    [SerializeField] private AIState _currentState = AIState.Patrol;
    [SerializeField] private Transform[] _patrolPoints;
    [SerializeField] private float _chaseRange = 10f;
    [SerializeField] private float _attackRange = 2f;
    [SerializeField] private float _attackCooldown = 1f;

    private NavMeshAgent _agent;
    private Transform _player;
    private int _currentPatrolIndex = 0;
    private float _lastAttackTime;

    private void Start()
    {
        _agent = GetComponent<NavMeshAgent>();
        _player = GameObject.FindGameObjectWithTag("Player")?.transform;
    }

    private void Update()
    {
        if (_player == null) return;

        float distanceToPlayer = Vector3.Distance(transform.position, _player.position);

        switch (_currentState)
        {
            case AIState.Patrol:
                Patrol();
                if (distanceToPlayer < _chaseRange)
                    _currentState = AIState.Chase;
                break;

            case AIState.Chase:
                Chase();
                if (distanceToPlayer < _attackRange)
                    _currentState = AIState.Attack;
                else if (distanceToPlayer > _chaseRange * 1.5f)
                    _currentState = AIState.Patrol;
                break;

            case AIState.Attack:
                Attack();
                if (distanceToPlayer > _attackRange)
                    _currentState = AIState.Chase;
                break;
        }
    }

    private void Patrol()
    {
        if (_patrolPoints.Length == 0) return;

        _agent.SetDestination(_patrolPoints[_currentPatrolIndex].position);

        if (Vector3.Distance(transform.position, _patrolPoints[_currentPatrolIndex].position) < 1f)
        {
            _currentPatrolIndex = (_currentPatrolIndex + 1) % _patrolPoints.Length;
        }
    }

    private void Chase()
    {
        _agent.SetDestination(_player.position);
    }

    private void Attack()
    {
        if (Time.time - _lastAttackTime > _attackCooldown)
        {
            Debug.Log("Enemy attacks!");
            _lastAttackTime = Time.time;
        }
    }
}
""",

            "Assets/Scripts/ScoreManager.cs": """using UnityEngine;

public class ScoreManager : MonoBehaviour
{
    public static ScoreManager Instance { get; private set; }

    public int Score { get; private set; }
    public int HighScore { get; private set; }

    private void Awake()
    {
        if (Instance == null)
        {
            Instance = this;
            HighScore = PlayerPrefs.GetInt("HighScore", 0);
        }
        else
        {
            Destroy(gameObject);
        }
    }

    public void AddScore(int points)
    {
        Score += points;
        if (Score > HighScore)
        {
            HighScore = Score;
            PlayerPrefs.SetInt("HighScore", HighScore);
        }
    }

    public void ResetScore()
    {
        Score = 0;
    }
}
""",

            "Assets/Scripts/CameraFollow.cs": """using UnityEngine;

public class CameraFollow : MonoBehaviour
{
    [SerializeField] private Transform _target;
    [SerializeField] private Vector3 _offset = new Vector3(0, 5, -10);
    [SerializeField] private float _smoothSpeed = 0.125f;
    [SerializeField] private Vector2 _minBounds;
    [SerializeField] private Vector2 _maxBounds;

    private void LateUpdate()
    {
        if (_target == null) return;

        Vector3 desiredPosition = _target.position + _offset;
        Vector3 smoothedPosition = Vector3.Lerp(transform.position, desiredPosition, _smoothSpeed);

        smoothedPosition.x = Mathf.Clamp(smoothedPosition.x, _minBounds.x, _maxBounds.x);
        smoothedPosition.y = Mathf.Clamp(smoothedPosition.y, _minBounds.y, _maxBounds.y);

        transform.position = smoothedPosition;
    }
}
""",

            "Assets/Shaders/CustomShader.shader": """Shader "Custom/YasminShader"
{
    Properties
    {
        _MainTex ("Texture", 2D) = "white" {}
        _Color ("Color", Color) = (1,1,1,1)
        _Glossiness ("Smoothness", Range(0,1)) = 0.5
        _Metallic ("Metallic", Range(0,1)) = 0.0
    }

    SubShader
    {
        Tags { "RenderType"="Opaque" }
        LOD 200

        CGPROGRAM
        #pragma surface surf Standard fullforwardshadows
        #pragma target 3.0

        sampler2D _MainTex;
        struct Input
        {
            float2 uv_MainTex;
        };

        fixed4 _Color;
        half _Glossiness;
        half _Metallic;

        void surf (Input IN, inout SurfaceOutputStandard o)
        {
            fixed4 c = tex2D (_MainTex, IN.uv_MainTex) * _Color;
            o.Albedo = c.rgb;
            o.Metallic = _Metallic;
            o.Smoothness = _Glossiness;
            o.Alpha = c.a;
        }
        ENDCG
    }

    FallBack "Diffuse"
}
""",

            "Assets/Editor/BuildScript.cs": """using UnityEditor;
using System.Linq;

public class BuildScript
{
    [MenuItem("Yasmin/Build/Windows")]
    public static void BuildWindows()
    {
        BuildPlayer(BuildTarget.StandaloneWindows64, "Builds/Windows");
    }

    [MenuItem("Yasmin/Build/Android")]
    public static void BuildAndroid()
    {
        BuildPlayer(BuildTarget.Android, "Builds/Android");
    }

    [MenuItem("Yasmin/Build/WebGL")]
    public static void BuildWebGL()
    {
        BuildPlayer(BuildTarget.WebGL, "Builds/WebGL");
    }

    private static void BuildPlayer(BuildTarget target, string outputPath)
    {
        string[] scenes = EditorBuildSettings.scenes
            .Where(s => s.enabled)
            .Select(s => s.path)
            .ToArray();

        BuildPipeline.BuildPlayer(scenes, outputPath, target, BuildOptions.None);
    }
}
""",

            "Packages/manifest.json": json.dumps({
                "dependencies": {
                    "com.unity.collab-proxy": "2.3.1",
                    "com.unity.feature.2d": "2.0.1",
                    "com.unity.ide.rider": "3.0.28",
                    "com.unity.ide.visualstudio": "2.0.22",
                    "com.unity.ide.vscode": "1.2.5",
                    "com.unity.test-framework": "1.3.9",
                    "com.unity.textmeshpro": "3.0.6",
                    "com.unity.timeline": "1.8.6",
                    "com.unity.ugui": "2.0.0",
                    "com.unity.visualscripting": "1.9.4",
                    "com.unity.ai.navigation": "2.0.0",
                    "com.unity.postprocessing": "3.4.0",
                    "com.unity.render-pipelines.universal": "16.0.5"
                }
            }, indent=2)
        }

        return {
            "framework": "unity",
            "version": "2023.2",
            "language": "csharp",
            "files": [{"path": k, "content": v} for k, v in files.items()],
            "total_files": len(files)
        }


generator = UnityGenerator()
